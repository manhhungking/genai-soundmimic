"""SoundMimic avatar builder — procedural humanoid mesh + rig + animation + GLB export.

Run with Blender in background mode, e.g.:
    blender --background --python scripts/avatars/build.py -- --avatar hung
    blender --background --python scripts/avatars/build.py -- --all

This is a PROCEDURAL pipeline (primitives sculpted/joined in code), not a hand-sculpted
character-art pipeline. It produces real geometry + a real humanoid armature + real
skinning + three real baked animation clips, exported as a genuine glTF/GLB with
skinning and animation data. It does NOT reproduce the painted concept-art fidelity of
docs/avatars/references/ — see docs/avatars/BUILD_REPORT.md for the honest gap analysis.
"""

import bpy
import bmesh
import math
import os
import sys
import json
from mathutils import Vector, Euler

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
# GLBs are exported to a staging area first — NOT public/ — so they can be reloaded and
# verified (mesh/skin/animation checks, a second independent GLTFLoader parse, and visual
# comparison against the character sheets) before anything touches the runtime asset.
# publish.py copies staged files into public/assets/avatars/ only after that check passes.
STAGING_DIR = os.path.join(REPO_ROOT, ".build-staging", "avatars")
ASSETS_SRC_DIR = os.path.join(REPO_ROOT, "assets-src", "avatars")
PREVIEW_DIR = os.path.join(REPO_ROOT, "docs", "avatars", "previews")


def avatar_src_dir(avatar_id):
    """assets-src/avatars/{id}/ — holds only the .blend source (kept for future edits)."""
    d = os.path.join(ASSETS_SRC_DIR, avatar_id)
    os.makedirs(d, exist_ok=True)
    return d

FPS = 24

# ---------------------------------------------------------------------------
# Character configuration (colors measured/approximated from docs/avatars/avatar-manifest.json)
# ---------------------------------------------------------------------------

CHARACTERS = {
    # Colors measured directly from each docs/avatars/references/{id}-character-sheet.png
    # "Color Palette" swatch panel (see docs/avatars/avatar-manifest.json palette.status =
    # "measured_from_character_sheet"). A few unlabeled swatches (marked below) were not
    # legible and are kept as best-effort approximations.
    # "sleeve" controls arm coverage — every reference wears sleeves of some length except
    # bare-armed styles that don't apply here; color defaults to the top color unless a
    # contrasting sleeve color is called out on the character sheet (e.g. Liam).
    "leo": {
        "gender": "male", "skin": "#F6C9A8", "hair": "#5B3A2E", "eyes": "#2E1E16",
        "top": "#2563EB", "trim": "#FFFFFF", "bottom": "#374151", "shoe": "#3B82F6",
        "hair_style": "short_swoop", "top_style": "hoodie_closed", "accessory": None,
        "sleeve": {"length": "long"},
    },
    "liam": {
        "gender": "male", "skin": "#FFD7C2", "hair": "#FBCF7D", "eyes": "#3274A5",  # eyes: approx (not swatched)
        "top": "#F8F9FC", "trim": "#2563EB", "bottom": "#4B5563", "shoe": "#3B82F6",
        "hair_style": "short_messy", "top_style": "tee_sleeve_contrast", "accessory": "headphones_neck",
        "accessory_color": "#2D2D2D",
        "sleeve": {"length": "long", "color": "#2563EB"},  # contrast blue sleeve over white torso
    },
    "noah": {
        "gender": "male", "skin": "#8B5A3C", "hair": "#2E1F16", "eyes": "#3B2E1F",
        "top": "#22A05A", "trim": "#FFFFFF", "bottom": "#4B5563", "shoe": "#16A34A",
        "hair_style": "short_curly", "top_style": "hoodie_closed", "accessory": None,
        "sleeve": {"length": "long"},
    },
    "kai": {
        "gender": "male", "skin": "#FCD7C4", "hair": "#D35400", "eyes": "#3B78A5",  # eyes: approx (not swatched)
        "top": "#E53935", "trim": "#FFFFFF", "bottom": "#374151", "shoe": "#E53935",
        "hair_style": "short_swoop", "top_style": "hoodie_closed", "accessory": "cap",
        "accessory_color": "#2563EB", "accessory_color2": "#E8F0FF",
        "sleeve": {"length": "long"},
    },
    "hung": {
        "gender": "male", "skin": "#F6C9AB", "hair": "#2D2A28", "eyes": "#392419",
        "top": "#1E63E9", "trim": "#FFFFFF", "bottom": "#374151", "shoe": "#1E63E9",
        "hair_style": "short_side_part", "top_style": "hoodie_open_star", "accessory": None,
        "star_color": "#2563EB",
        # Sleeves for the open hoodie are built specially in build_clothing (they need to
        # sit over the tee, not under it) — no generic "sleeve" entry needed here.
    },
    "maya": {
        "gender": "female", "skin": "#F9D8E0", "hair": "#1F1F1F", "eyes": "#35231C",  # eyes: approx (not swatched)
        "top": "#8B5CF6", "trim": "#F3E8FF", "bottom": "#6B7280", "shoe": "#8B5CF6",
        "hair_style": "long_straight", "top_style": "hoodie_closed_heart", "accessory": "headphones_head",
        "accessory_color": "#A855F7",
        "sleeve": {"length": "long"},
    },
    "zoe": {
        "gender": "female", "skin": "#FDDCC3", "hair": "#FBD37A", "eyes": "#6DA5FF",
        "top": "#FF7E73", "trim": "#FFFFFF", "bottom": "#5B8CCB", "shoe": "#FF7E73",
        "hair_style": "long_wavy", "top_style": "hoodie_closed", "accessory": None,
        "sleeve": {"length": "long"},
    },
    "aisha": {
        "gender": "female", "skin": "#8B5A3C", "hair": "#3E2A1F", "eyes": "#2D1B12",
        "top": "#F7C839", "trim": "#FBC02D", "bottom": "#3B82F6", "shoe": "#F7C839",
        "hair_style": "long_curly", "top_style": "overalls", "accessory": "headband",
        "accessory_color": "#FBC02D",
        "sleeve": {"length": "short"},  # short-sleeve yellow tee under the overalls
    },
    "emma": {
        "gender": "female", "skin": "#F7D7C4", "hair": "#E86B3C", "eyes": "#657A90",  # eyes: approx (not swatched)
        "top": "#FDCB3B", "trim": "#FFFDF7", "bottom": "#4F7BC4", "shoe": "#F4B400",
        "hair_style": "long_wavy", "top_style": "hoodie_closed", "accessory": "glasses",
        "accessory_color": "#2D1F1A",
        "sleeve": {"length": "long"},
    },
    "hana": {
        "gender": "female", "skin": "#F3C9A6", "hair": "#3E2D1F", "eyes": "#3A2419",  # eyes: approx (not swatched)
        "top": "#FFFFFF", "trim": "#2E6CC5", "bottom": "#2E6CC5", "shoe": "#A7B4CC",
        "hair_style": "long_straight", "top_style": "overalls", "accessory": "beanie_bear",
        "sleeve": {"length": "long"},  # long-sleeve white/cream shirt under the overalls
        "accessory_color": "#F8F5EE", "accessory_color2": "#D4A574",
    },
}

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------


def hex_to_rgb(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255.0 for i in (0, 2, 4))
    # sRGB -> linear for Blender's color management
    def to_lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (to_lin(r), to_lin(g), to_lin(b), 1.0)


def make_material(name, hex_color, roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = hex_to_rgb(hex_color)
    bsdf.inputs["Roughness"].default_value = roughness
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block_type in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials, bpy.data.actions):
        for block in list(block_type):
            if block.users == 0:
                block_type.remove(block)


def add_cylinder(name, radius, depth, location, rotation=(0, 0, 0), verts=10):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts, radius=radius, depth=depth, location=location, rotation=rotation
    )
    obj = bpy.context.active_object
    obj.name = name
    bpy.ops.object.shade_smooth()
    return obj


def add_sphere(name, radius, location, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location, segments=16, ring_count=10)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.shade_smooth()
    return obj


def add_cube(name, size, location, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.shade_smooth()
    return obj


def apply_all_transforms(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def bevel_and_subsurf(obj, bevel_width=0.006, subsurf_levels=2):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bevel = obj.modifiers.new("Bevel", "BEVEL")
    bevel.width = bevel_width
    bevel.segments = 2
    subsurf = obj.modifiers.new("Subsurf", "SUBSURF")
    subsurf.levels = subsurf_levels
    subsurf.render_levels = subsurf_levels
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    bpy.ops.object.modifier_apply(modifier=subsurf.name)


def join_objects(objs, name):
    if not objs:
        return None
    if len(objs) == 1:
        # bpy.ops.object.join() logs a harmless "No mesh data to join" warning when given
        # a single object (nothing to merge into it) — skip the no-op call entirely.
        objs[0].name = name
        return objs[0]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    result = bpy.context.active_object
    result.name = name
    return result


def assign_material(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


# ---------------------------------------------------------------------------
# Body proportions (meters). Origin = floor, between feet. Child-like proportions.
# ---------------------------------------------------------------------------

P = {
    "foot_h": 0.05,
    "shin_len": 0.28,
    "thigh_len": 0.28,
    "hip_width": 0.085,
    "torso_len": 0.30,
    "neck_len": 0.05,
    "head_r": 0.125,
    "shoulder_width": 0.185,
    "upper_arm_len": 0.20,
    "forearm_len": 0.18,
    "hand_len": 0.09,
    "limb_r": 0.038,
    "torso_r": 0.11,
}

Z_ANKLE = P["foot_h"]
Z_KNEE = Z_ANKLE + P["shin_len"]
Z_HIP = Z_KNEE + P["thigh_len"]
Z_CHEST = Z_HIP + P["torso_len"]
Z_NECK = Z_CHEST + P["neck_len"]
Z_HEAD = Z_NECK + P["head_r"]
Z_SHOULDER = Z_CHEST - 0.02


def build_limb_chain(prefix, side, hip_x):
    """Leg: hip -> knee -> ankle -> foot. Returns dict of mesh objects."""
    objs = {}
    thigh_mid_z = (Z_HIP + Z_KNEE) / 2
    objs["thigh"] = add_cylinder(
        f"{prefix}Thigh.{side}", P["limb_r"], P["thigh_len"], (hip_x, 0, thigh_mid_z)
    )
    shin_mid_z = (Z_KNEE + Z_ANKLE) / 2
    objs["shin"] = add_cylinder(
        f"{prefix}Shin.{side}", P["limb_r"] * 0.85, P["shin_len"], (hip_x, 0, shin_mid_z)
    )
    objs["foot"] = add_cube(
        f"{prefix}Foot.{side}", (0.075, 0.16, P["foot_h"]), (hip_x, 0.045, P["foot_h"] / 2)
    )
    return objs


def build_arm_chain(prefix, side, shoulder_x, sign):
    objs = {}
    upper_mid_z = Z_SHOULDER - P["upper_arm_len"] / 2
    objs["upper"] = add_cylinder(
        f"{prefix}UpperArm.{side}", P["limb_r"] * 0.82, P["upper_arm_len"], (shoulder_x, 0, upper_mid_z)
    )
    z_elbow = Z_SHOULDER - P["upper_arm_len"]
    fore_mid_z = z_elbow - P["forearm_len"] / 2
    objs["fore"] = add_cylinder(
        f"{prefix}ForeArm.{side}", P["limb_r"] * 0.7, P["forearm_len"], (shoulder_x, 0, fore_mid_z)
    )
    z_wrist = z_elbow - P["forearm_len"]
    hand_mid_z = z_wrist - P["hand_len"] / 2
    objs["hand"] = add_sphere(
        f"{prefix}Hand.{side}", P["limb_r"] * 0.85, (shoulder_x, 0, hand_mid_z), scale=(0.9, 0.6, 1.3)
    )
    return objs


def build_body_mesh(cfg):
    """Builds the deforming body mesh (skin) and returns the joined object."""
    parts = []

    # Torso: hip -> chest, tapered cylinder approximated with two stacked cylinders.
    lower_torso = add_cylinder("TorsoLower", P["torso_r"] * 0.95, P["torso_len"] * 0.55,
                                (0, 0, Z_HIP + P["torso_len"] * 0.275))
    upper_torso = add_cylinder("TorsoUpper", P["torso_r"], P["torso_len"] * 0.5,
                                (0, 0, Z_CHEST - P["torso_len"] * 0.25))
    parts += [lower_torso, upper_torso]

    neck = add_cylinder("Neck", 0.045, P["neck_len"] * 1.4, (0, 0, (Z_CHEST + Z_NECK) / 2))
    parts.append(neck)

    head = add_sphere("Head", P["head_r"], (0, 0, Z_HEAD), scale=(0.92, 0.98, 1.0))
    parts.append(head)

    # Ears
    for side, sx in (("L", -1), ("R", 1)):
        ear = add_sphere(f"Ear.{side}", 0.022, (sx * P["head_r"] * 0.95, -0.01, Z_HEAD), scale=(0.6, 0.4, 1.0))
        parts.append(ear)

    # Nose
    nose = add_sphere("Nose", 0.018, (0, -P["head_r"] * 0.92, Z_HEAD - 0.01), scale=(0.8, 1.1, 0.9))
    parts.append(nose)

    # Hips + legs
    hip_x = P["hip_width"]
    for side, sign in (("L", -1), ("R", 1)):
        leg = build_limb_chain("Leg", side, sign * hip_x)
        parts += list(leg.values())

    # Arms
    shoulder_x = P["shoulder_width"]
    for side, sign in (("L", -1), ("R", 1)):
        arm = build_arm_chain("Arm", side, sign * shoulder_x, sign)
        parts += list(arm.values())

    for p in parts:
        bevel_and_subsurf(p, bevel_width=0.01, subsurf_levels=1)

    body = join_objects(parts, "Body")
    mat = make_material("Skin", cfg["skin"])
    assign_material(body, mat)
    return body


def build_face_features(cfg):
    """Eyes, eyebrows, mouth, eyelids (for blink shape key), pupil highlight."""
    eye_z = Z_HEAD + 0.01
    eye_y = -P["head_r"] * 0.86
    eye_x = 0.045

    white_mat = make_material("EyeWhite", "#FFFFFF", roughness=0.2)
    iris_mat = make_material("EyeIris", cfg["eyes"], roughness=0.25)
    brow_mat = make_material("Brow", cfg["hair"], roughness=0.6)
    mouth_mat = make_material("Mouth", "#7A2E2E", roughness=0.4)
    lid_mat = make_material("Eyelid", cfg["skin"], roughness=0.55)

    eyes, lids, brows = [], [], []
    for side, sx in (("L", -1), ("R", 1)):
        white = add_sphere(f"EyeWhite.{side}", 0.024, (sx * eye_x, eye_y, eye_z), scale=(0.8, 0.7, 1.0))
        assign_material(white, white_mat)
        eyes.append(white)

        iris = add_sphere(f"EyeIris.{side}", 0.013, (sx * eye_x, eye_y - 0.017, eye_z), scale=(1, 0.6, 1))
        assign_material(iris, iris_mat)
        eyes.append(iris)

        brow = add_cube(f"Brow.{side}", (0.032, 0.008, 0.009), (sx * eye_x, eye_y - 0.005, eye_z + 0.028),
                         rotation=(0.1, 0, sx * -0.15))
        assign_material(brow, brow_mat)
        brows.append(brow)

        # Eyelid: sits tucked above the eye at rest; a Blink shape key drives it down.
        lid = add_sphere(f"Eyelid.{side}", 0.026, (sx * eye_x, eye_y - 0.006, eye_z + 0.016),
                          scale=(0.85, 0.75, 0.55))
        assign_material(lid, lid_mat)
        lids.append(lid)

    mouth = add_sphere("Mouth", 0.022, (0, -P["head_r"] * 0.88, Z_HEAD - 0.055), scale=(1.1, 0.5, 0.4))
    assign_material(mouth, mouth_mat)

    return {"eyes": eyes, "lids": lids, "brows": brows, "mouth": mouth}


# ---------------------------------------------------------------------------
# Hair
# ---------------------------------------------------------------------------


def build_hair(style, color):
    mat = make_material("Hair", color, roughness=0.45)
    parts = []
    cap = add_sphere("HairCap", P["head_r"] * 1.04, (0, 0.01, Z_HEAD + 0.01), scale=(1.0, 1.0, 0.95))
    # Trim the cap so it only covers the top/back (delete lower-front vertices) using bmesh.
    bpy.context.view_layer.objects.active = cap
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(cap.data)
    to_delete = [v for v in bm.verts if v.co.z < -0.01 and v.co.y < 0.02]
    bmesh.ops.delete(bm, geom=to_delete, context="VERTS")
    bmesh.update_edit_mesh(cap.data)
    bpy.ops.object.mode_set(mode="OBJECT")
    parts.append(cap)

    if style in ("short_swoop", "short_messy", "short_curly", "short_side_part"):
        n = 10 if style != "short_curly" else 16
        for i in range(n):
            ang = (i / n) * math.tau
            r = P["head_r"] * 0.85
            x = math.cos(ang) * r * 0.9
            y = math.sin(ang) * r * 0.9 + 0.02
            if y > P["head_r"] * 0.55:  # skip face-front clumps
                continue
            clump = add_sphere(
                f"HairClump.{i}", 0.028 if style != "short_curly" else 0.032,
                (x, y, Z_HEAD + P["head_r"] * 0.55),
                scale=(1.0, 1.0, 1.3 if style == "short_swoop" else 0.9),
            )
            parts.append(clump)
    elif style in ("long_straight", "long_wavy", "long_curly"):
        # Back sheet of hair extending down past the shoulders.
        length = 0.30 if style != "long_curly" else 0.26
        back = add_cylinder("HairBack", P["head_r"] * 0.78, length,
                             (0, 0.055, Z_HEAD - length / 2 + 0.02), rotation=(math.radians(6), 0, 0))
        back.scale = (1.0, 0.5, 1.0)
        parts.append(back)
        if style == "long_curly":
            for i in range(14):
                ang = (i / 14) * math.tau
                r = P["head_r"] * 0.7
                clump = add_sphere(f"HairCurl.{i}", 0.03, (math.cos(ang) * r, 0.05 + math.sin(ang) * 0.03,
                                    Z_HEAD - 0.05 - (i % 3) * 0.04), scale=(1, 1, 1))
                parts.append(clump)

    for p in parts:
        bevel_and_subsurf(p, bevel_width=0.008, subsurf_levels=1)
    hair = join_objects(parts, "Hair")
    assign_material(hair, mat)
    return hair


# ---------------------------------------------------------------------------
# Clothing
# ---------------------------------------------------------------------------


def build_star(color, size=0.045):
    mesh = bpy.data.meshes.new("StarMesh")
    bm = bmesh.new()
    verts = []
    for i in range(10):
        ang = math.pi / 2 + i * math.pi / 5
        r = size if i % 2 == 0 else size * 0.4
        verts.append(bm.verts.new((math.cos(ang) * r, math.sin(ang) * r, 0)))
    bm.faces.new(verts)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.006)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Star", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.shade_smooth()
    mat = make_material("StarMat", color, roughness=0.4)
    assign_material(obj, mat)
    return obj


def build_heart(color, size=0.032):
    """Classic parametric heart-curve silhouette, solidified into a thin logo patch."""
    mesh = bpy.data.meshes.new("HeartMesh")
    bm = bmesh.new()
    verts = []
    steps = 24
    scale = size / 16.0
    for i in range(steps):
        t = (i / steps) * math.tau
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        verts.append(bm.verts.new((x * scale, y * scale, 0)))
    bm.faces.new(verts)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.005)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Heart", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.shade_smooth()
    mat = make_material("HeartMat", color, roughness=0.4)
    assign_material(obj, mat)
    return obj


def build_clothing(cfg):
    top_mat = make_material("Top", cfg["top"])
    trim_mat = make_material("Trim", cfg.get("trim", "#FFFFFF"))
    bottom_mat = make_material("Bottom", cfg["bottom"])
    shoe_mat = make_material("Shoe", cfg["shoe"])

    parts_top, parts_bottom, parts_shoe = [], [], []
    style = cfg["top_style"]

    open_hoodie = style == "hoodie_open_star"

    # Torso garment (hoodie/tee), slightly larger radius than skin torso so it reads as clothing.
    if open_hoodie:
        # Two open panels (left/right) instead of a closed cylinder, so the white tee shows through.
        for side, sx in ((-1, -1), (1, 1)):
            panel = add_cylinder(f"HoodiePanel.{side}", P["torso_r"] * 0.62, P["torso_len"] * 0.98,
                                  (sx * P["torso_r"] * 0.55, 0.01, Z_HIP + P["torso_len"] * 0.5), verts=8)
            parts_top.append(panel)
        tee = add_cylinder("TeeShirt", P["torso_r"] * 1.02, P["torso_len"] * 0.85,
                            (0, -0.01, Z_HIP + P["torso_len"] * 0.5))
        bevel_and_subsurf(tee, bevel_width=0.008, subsurf_levels=1)
        assign_material(tee, trim_mat)
        star = build_star(cfg.get("star_color", "#2563EB"))
        # Sit proud of the tee's front surface (tee front is at y ~= -0.01 - radius) so it
        # doesn't get swallowed by the tee mesh.
        star.location = (0, -0.01 - P["torso_r"] * 1.02 - 0.006, Z_CHEST - 0.06)
        star.rotation_euler = (math.radians(90), 0, 0)
        parts_top_extra = [tee, star]
        # Full-length hoodie sleeves (the hoodie is unzipped at the torso but still long-sleeve).
        for side, sx in (("L", -1), ("R", 1)):
            sleeve = add_cylinder(f"HoodieSleeve.{side}", P["limb_r"] * 1.05,
                                   P["upper_arm_len"] + P["forearm_len"] * 0.7,
                                   (sx * P["shoulder_width"], 0,
                                    Z_SHOULDER - (P["upper_arm_len"] + P["forearm_len"] * 0.7) / 2))
            parts_top.append(sleeve)
    else:
        torso_garment = add_cylinder("TorsoGarment", P["torso_r"] * 1.08, P["torso_len"] * 0.95,
                                      (0, 0, Z_HIP + P["torso_len"] * 0.5))
        parts_top.append(torso_garment)
        parts_top_extra = []

    overalls_objs = []
    if style == "overalls":
        # Bib overalls: a plain shirt (top color) UNDER a denim bib + straps (bottom/denim
        # color). These two pieces must stay separate meshes with separate materials — an
        # earlier version joined the bib into the shirt mesh and painted both with the
        # shirt's single material, making the denim bib invisible.
        undertop = add_cylinder("UnderTop", P["torso_r"] * 1.05, P["torso_len"] * 0.9,
                                 (0, 0, Z_HIP + P["torso_len"] * 0.5))
        parts_top.append(("under", undertop))
        bib = add_cube("Bib", (P["torso_r"] * 1.1, 0.02, P["torso_len"] * 0.4),
                        (0, -P["torso_r"] * 0.9, Z_CHEST - P["torso_len"] * 0.15))
        overalls_objs.append(bib)
        for side, sx in (("L", -1), ("R", 1)):
            strap = add_cube(f"Strap.{side}", (0.02, 0.02, P["torso_len"] * 0.35),
                              (sx * P["torso_r"] * 0.55, -P["torso_r"] * 0.6, Z_SHOULDER - 0.02))
            overalls_objs.append(strap)
        denim_mat = make_material("Denim", cfg["bottom"])
        for obj in overalls_objs:
            bevel_and_subsurf(obj, bevel_width=0.006, subsurf_levels=1)
            assign_material(obj, denim_mat)

    heart_obj = None
    if style == "hoodie_closed_heart":
        heart_obj = build_heart(cfg.get("trim", "#FFFFFF"))
        # Small logo on the wearer's left chest, sitting just proud of the closed hoodie surface.
        heart_obj.location = (-P["torso_r"] * 0.45, -P["torso_r"] * 1.08 - 0.004, Z_CHEST - 0.05)
        heart_obj.rotation_euler = (math.radians(90), 0, 0)

    # Generic sleeves, driven by cfg["sleeve"] (every non-open-hoodie style needs this — the
    # open hoodie builds its own sleeves above, over the tee rather than the bare torso).
    # Built as their own object(s) with their own material rather than merged into top_objs,
    # so a contrasting sleeve color (e.g. Liam's blue-on-white) actually survives — merging
    # differently-colored parts into one joined mesh before a single assign_material() call
    # was the earlier bug that made contrast sleeves invisible.
    sleeve_objs = []
    sleeve_cfg = cfg.get("sleeve")
    if sleeve_cfg:
        is_long = sleeve_cfg.get("length") == "long"
        sleeve_color = sleeve_cfg.get("color", cfg["top"])
        length = (P["upper_arm_len"] + P["forearm_len"]) * 0.92 if is_long else P["upper_arm_len"] * 0.55
        for side, sx in (("L", -1), ("R", 1)):
            sleeve = add_cylinder(f"Sleeve.{side}", P["limb_r"] * 1.05, length,
                                   (sx * P["shoulder_width"], 0, Z_SHOULDER - length / 2))
            sleeve_objs.append(sleeve)
        sleeve_mat = make_material(f"SleeveMat.{sleeve_color}", sleeve_color)
        for obj in sleeve_objs:
            bevel_and_subsurf(obj, bevel_width=0.006, subsurf_levels=1)
            assign_material(obj, sleeve_mat)

    # Pants (two leg cylinders over the thighs+shins).
    for side, sx in (("L", -1), ("R", 1)):
        pant = add_cylinder(f"Pant.{side}", P["limb_r"] * 1.15, (P["thigh_len"] + P["shin_len"]) * 0.92,
                             (sx * P["hip_width"], 0, Z_ANKLE + (P["thigh_len"] + P["shin_len"]) * 0.48))
        parts_bottom.append(pant)

    # Shoes (box over the foot cylinders/cubes already in skin; add colored overlay).
    for side, sx in (("L", -1), ("R", 1)):
        shoe = add_cube(f"Shoe.{side}", (0.08, 0.17, P["foot_h"] * 1.15),
                         (sx * P["hip_width"], 0.045, P["foot_h"] / 2))
        parts_shoe.append(shoe)

    for grp in (parts_top, parts_bottom, parts_shoe):
        for p in grp:
            obj = p[1] if isinstance(p, tuple) else p
            bevel_and_subsurf(obj, bevel_width=0.006, subsurf_levels=1)

    top_objs = [p[1] if isinstance(p, tuple) else p for p in parts_top]
    top_mesh = join_objects(top_objs, "ClothingTop") if top_objs else None
    if top_mesh:
        assign_material(top_mesh, top_mat)

    bottom_mesh = join_objects(parts_bottom, "ClothingBottom")
    assign_material(bottom_mesh, bottom_mat)

    shoe_mesh = join_objects(parts_shoe, "ClothingShoes")
    assign_material(shoe_mesh, shoe_mat)

    extras = []
    if open_hoodie:
        for obj in parts_top_extra:
            bevel_and_subsurf(obj, bevel_width=0.006, subsurf_levels=1) if obj.name != "Star" else None
        extras.append(parts_top_extra[0])  # tee
        star_obj = parts_top_extra[1]
        extras.append(star_obj)
    if heart_obj:
        extras.append(heart_obj)
    extras += sleeve_objs
    extras += overalls_objs

    return {"top": top_mesh, "bottom": bottom_mesh, "shoes": shoe_mesh, "extras": extras}


def build_accessory(cfg):
    """Returns list of (object, target_bone) for rigid, bone-parented accessories."""
    kind = cfg.get("accessory")
    if not kind:
        return []
    color = cfg.get("accessory_color", "#333333")
    mat = make_material("Accessory", color)
    results = []

    if kind == "cap":
        cap = add_sphere("Cap", P["head_r"] * 1.08, (0, -0.01, Z_HEAD + 0.02), scale=(1.0, 1.0, 0.7))
        bpy.context.view_layer.objects.active = cap
        bpy.ops.object.mode_set(mode="EDIT")
        bm = bmesh.from_edit_mesh(cap.data)
        to_del = [v for v in bm.verts if v.co.z < 0]
        bmesh.ops.delete(bm, geom=to_del, context="VERTS")
        bmesh.update_edit_mesh(cap.data)
        bpy.ops.object.mode_set(mode="OBJECT")
        assign_material(cap, mat)
        brim_mat = make_material("CapBrim", cfg.get("accessory_color2", "#FFFFFF"))
        brim = add_cube("CapBrim", (0.07, 0.06, 0.012), (0, -P["head_r"] * 1.05, Z_HEAD + 0.02))
        assign_material(brim, brim_mat)
        bevel_and_subsurf(cap, 0.006, 1)
        results += [(cap, "Head"), (brim, "Head")]
    elif kind == "headphones_neck":
        band = add_cylinder("HeadphoneBand", 0.05, 0.02, (0, 0, Z_NECK + 0.03), rotation=(math.radians(90), 0, 0))
        for side, sx in (("L", -1), ("R", 1)):
            cup = add_sphere(f"HeadphoneCup.{side}", 0.03, (sx * 0.07, 0, Z_NECK + 0.02), scale=(0.6, 1, 1))
            assign_material(cup, mat)
            bevel_and_subsurf(cup, 0.004, 1)
            results.append((cup, "Neck"))
        assign_material(band, mat)
        bevel_and_subsurf(band, 0.004, 1)
        results.append((band, "Neck"))
    elif kind == "headphones_head":
        band = add_cylinder("HeadphoneBand", P["head_r"] * 1.05, 0.02, (0, 0, Z_HEAD + P["head_r"] * 0.9),
                             rotation=(math.radians(90), 0, 0))
        for side, sx in (("L", -1), ("R", 1)):
            cup = add_sphere(f"HeadphoneCup.{side}", 0.032, (sx * P["head_r"] * 0.95, -0.01, Z_HEAD),
                              scale=(0.6, 1, 1))
            assign_material(cup, mat)
            bevel_and_subsurf(cup, 0.004, 1)
            results.append((cup, "Head"))
        assign_material(band, mat)
        bevel_and_subsurf(band, 0.004, 1)
        results.append((band, "Head"))
    elif kind == "glasses":
        for side, sx in (("L", -1), ("R", 1)):
            ring = add_cylinder(f"GlassRing.{side}", 0.026, 0.006,
                                 (sx * 0.045, -P["head_r"] * 0.9, Z_HEAD + 0.005), rotation=(math.radians(90), 0, 0))
            assign_material(ring, mat)
            bevel_and_subsurf(ring, 0.003, 1)
            results.append((ring, "Head"))
        bridge = add_cube("GlassBridge", (0.02, 0.006, 0.006), (0, -P["head_r"] * 0.9, Z_HEAD + 0.005))
        assign_material(bridge, mat)
        results.append((bridge, "Head"))
    elif kind == "headband":
        band = add_cylinder("Headband", P["head_r"] * 1.02, 0.03, (0, 0.01, Z_HEAD + P["head_r"] * 0.75),
                             rotation=(math.radians(90), 0, 0))
        assign_material(band, mat)
        bevel_and_subsurf(band, 0.005, 1)
        results.append((band, "Head"))
    elif kind == "beanie_bear":
        beanie = add_sphere("Beanie", P["head_r"] * 1.1, (0, 0, Z_HEAD + 0.02), scale=(1, 1, 0.85))
        bpy.context.view_layer.objects.active = beanie
        bpy.ops.object.mode_set(mode="EDIT")
        bm = bmesh.from_edit_mesh(beanie.data)
        to_del = [v for v in bm.verts if v.co.z < -0.02]
        bmesh.ops.delete(bm, geom=to_del, context="VERTS")
        bmesh.update_edit_mesh(beanie.data)
        bpy.ops.object.mode_set(mode="OBJECT")
        assign_material(beanie, mat)
        bevel_and_subsurf(beanie, 0.006, 1)
        results.append((beanie, "Head"))
        ear_mat = make_material("BearEar", cfg.get("accessory_color2", "#BC8C62"))
        for side, sx in (("L", -1), ("R", 1)):
            ear = add_sphere(f"BearEar.{side}", 0.03, (sx * P["head_r"] * 0.7, 0, Z_HEAD + P["head_r"] * 0.85))
            assign_material(ear, ear_mat)
            bevel_and_subsurf(ear, 0.004, 1)
            results.append((ear, "Head"))
    return results


# ---------------------------------------------------------------------------
# Armature
# ---------------------------------------------------------------------------

BONE_SPEC = [
    # (name, head, tail, parent)
    ("Hips", (0, 0, Z_HIP), (0, 0, Z_HIP + 0.06), None),
    ("Spine", (0, 0, Z_HIP), (0, 0, Z_CHEST), "Hips"),
    ("Chest", (0, 0, Z_CHEST), (0, 0, Z_NECK), "Spine"),
    ("Neck", (0, 0, Z_NECK), (0, 0, Z_NECK + P["neck_len"]), "Chest"),
    ("Head", (0, 0, Z_NECK + P["neck_len"]), (0, 0, Z_HEAD + P["head_r"]), "Neck"),
]

for side, sx in (("L", -1), ("R", 1)):
    BONE_SPEC += [
        (f"Shoulder.{side}", (0, 0, Z_SHOULDER), (sx * P["shoulder_width"], 0, Z_SHOULDER), "Chest"),
        (f"UpperArm.{side}", (sx * P["shoulder_width"], 0, Z_SHOULDER),
         (sx * P["shoulder_width"], 0, Z_SHOULDER - P["upper_arm_len"]), f"Shoulder.{side}"),
        (f"ForeArm.{side}", (sx * P["shoulder_width"], 0, Z_SHOULDER - P["upper_arm_len"]),
         (sx * P["shoulder_width"], 0, Z_SHOULDER - P["upper_arm_len"] - P["forearm_len"]), f"UpperArm.{side}"),
        (f"Hand.{side}", (sx * P["shoulder_width"], 0, Z_SHOULDER - P["upper_arm_len"] - P["forearm_len"]),
         (sx * P["shoulder_width"], 0, Z_SHOULDER - P["upper_arm_len"] - P["forearm_len"] - P["hand_len"]),
         f"ForeArm.{side}"),
        (f"UpperLeg.{side}", (sx * P["hip_width"], 0, Z_HIP), (sx * P["hip_width"], 0, Z_KNEE), "Hips"),
        (f"LowerLeg.{side}", (sx * P["hip_width"], 0, Z_KNEE), (sx * P["hip_width"], 0, Z_ANKLE),
         f"UpperLeg.{side}"),
        (f"Foot.{side}", (sx * P["hip_width"], 0, Z_ANKLE), (sx * P["hip_width"], 0.12, 0.01),
         f"LowerLeg.{side}"),
    ]


def build_armature():
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    arm_obj = bpy.context.active_object
    arm_obj.name = "Armature"
    arm_data = arm_obj.data
    arm_data.name = "ArmatureData"
    eb = arm_data.edit_bones
    eb.remove(eb["Bone"])
    created = {}
    for name, head, tail, parent in BONE_SPEC:
        b = eb.new(name)
        b.head = head
        b.tail = tail
        if parent:
            b.parent = created[parent]
            b.use_connect = False
        created[name] = b
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


def bone_parent_object(obj, armature, bone_name):
    obj.parent = armature
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    # parent_type BONE offsets by bone tail in Blender; compensate to keep world position.
    bone = armature.data.bones[bone_name]
    mat_world = obj.matrix_world.copy()
    obj.matrix_parent_inverse = (armature.matrix_world @ bone.matrix_local).inverted()
    obj.matrix_world = mat_world


# ---------------------------------------------------------------------------
# Animation
# ---------------------------------------------------------------------------


def set_pose_bone_rotation(armature, bone_name, euler_xyz, frame):
    pb = armature.pose.bones[bone_name]
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = Euler(euler_xyz, "XYZ")
    pb.keyframe_insert(data_path="rotation_euler", frame=frame)


def set_root_location(armature, bone_name, loc, frame):
    pb = armature.pose.bones[bone_name]
    pb.location = loc
    pb.keyframe_insert(data_path="location", frame=frame)


def new_action(armature, name):
    armature.animation_data_create()
    action = bpy.data.actions.new(name)
    armature.animation_data.action = action
    return action


def clear_pose(armature):
    for pb in armature.pose.bones:
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)


def set_default_interpolation(kind="BEZIER", handle="AUTO_CLAMPED"):
    edit = bpy.context.preferences.edit
    edit.keyframe_new_interpolation_type = kind
    edit.keyframe_new_handle_type = handle


def bake_idle(armature):
    set_default_interpolation("SINE")
    action = new_action(armature, "idle")
    clear_pose(armature)
    total = FPS * 2  # 2s loop
    for f in (1, total):
        set_root_location(armature, "Hips", (0, 0, 0), f)
        set_pose_bone_rotation(armature, "Chest", (0, 0, 0), f)
        set_pose_bone_rotation(armature, "Head", (0, 0, 0), f)
    mid = total // 2
    set_root_location(armature, "Hips", (0, 0, 0.006), mid)
    set_pose_bone_rotation(armature, "Chest", (math.radians(1.5), 0, 0), mid)
    set_pose_bone_rotation(armature, "Head", (math.radians(-1.0), 0, math.radians(1.5)), mid)
    return action


def bake_walk(armature):
    set_default_interpolation("BEZIER", "AUTO_CLAMPED")
    action = new_action(armature, "walk")
    clear_pose(armature)
    total = FPS * 1  # 1s loop, in-place walk cycle
    swing = math.radians(28)
    knee_bend = math.radians(35)
    keyframes = [0, total / 4, total / 2, (3 * total) / 4, total]
    for i, f in enumerate(keyframes):
        phase = (i / (len(keyframes) - 1)) * math.tau
        leg_l = math.sin(phase) * swing
        leg_r = math.sin(phase + math.pi) * swing
        knee_l = max(0, math.sin(phase + math.pi * 0.5)) * knee_bend
        knee_r = max(0, math.sin(phase + math.pi * 1.5)) * knee_bend
        arm_l = math.sin(phase + math.pi) * swing * 0.7
        arm_r = math.sin(phase) * swing * 0.7
        set_pose_bone_rotation(armature, "UpperLeg.L", (leg_l, 0, 0), f)
        set_pose_bone_rotation(armature, "UpperLeg.R", (leg_r, 0, 0), f)
        set_pose_bone_rotation(armature, "LowerLeg.L", (-knee_l, 0, 0), f)
        set_pose_bone_rotation(armature, "LowerLeg.R", (-knee_r, 0, 0), f)
        set_pose_bone_rotation(armature, "UpperArm.L", (arm_l, 0, 0), f)
        set_pose_bone_rotation(armature, "UpperArm.R", (arm_r, 0, 0), f)
        bob = abs(math.sin(phase * 2)) * 0.012
        set_root_location(armature, "Hips", (0, 0, bob), f)
    return action


def bake_perform(armature):
    set_default_interpolation("SINE")
    action = new_action(armature, "perform")
    clear_pose(armature)
    total = FPS * 2
    for f in (1, total):
        set_pose_bone_rotation(armature, "Head", (0, 0, 0), f)
        set_pose_bone_rotation(armature, "Chest", (0, 0, 0), f)
        set_pose_bone_rotation(armature, "UpperArm.R", (0, 0, 0), f)
        set_pose_bone_rotation(armature, "ForeArm.R", (0, 0, 0), f)
    mid = total // 2
    set_pose_bone_rotation(armature, "Head", (math.radians(-3), math.radians(4), 0), mid)
    set_pose_bone_rotation(armature, "Chest", (0, math.radians(3), 0), mid)
    set_pose_bone_rotation(armature, "UpperArm.R", (math.radians(-18), 0, math.radians(-10)), mid)
    set_pose_bone_rotation(armature, "ForeArm.R", (math.radians(-12), 0, 0), mid)
    return action


def push_to_nla(armature, action):
    track = armature.animation_data.nla_tracks.new()
    track.name = action.name
    track.strips.new(action.name, int(action.frame_range[0]), action)


# ---------------------------------------------------------------------------
# Shape keys (mouthOpen / blink) — implemented on the Body mesh (mouth/eyelids are
# separate joined-in meshes with distinct vertex ranges we tag while building).
# ---------------------------------------------------------------------------


def add_shape_keys(body_obj, mouth_center, mouth_radius, lid_objs_info):
    """Adds Basis + MouthOpen shape keys to body_obj. Eyelids get their own Basis + Blink."""
    if body_obj.data.shape_keys is None:
        body_obj.shape_key_add(name="Basis")
    mouth_key = body_obj.shape_key_add(name="MouthOpen")
    mesh = body_obj.data
    for i, v in enumerate(mesh.vertices):
        d = (v.co - Vector(mouth_center)).length
        if d < mouth_radius:
            falloff = 1.0 - (d / mouth_radius)
            offset = Vector((0, -0.006, -0.014)) * falloff
            mouth_key.data[i].co = v.co + offset
    mouth_key.value = 0.0


def add_eyelid_blink(lid_objs):
    for lid in lid_objs:
        if lid.data.shape_keys is None:
            lid.shape_key_add(name="Basis")
        blink_key = lid.shape_key_add(name="Blink")
        for i, v in enumerate(lid.data.vertices):
            blink_key.data[i].co = v.co + Vector((0, 0, -0.022))
        blink_key.value = 0.0


# ---------------------------------------------------------------------------
# Render preview
# ---------------------------------------------------------------------------


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("World") if scene.world is None else scene.world
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.75, 0.85, 0.95, 1.0)

    key = bpy.data.lights.new("KeyLight", "SUN")
    key.energy = 3.0
    key_obj = bpy.data.objects.new("KeyLight", key)
    bpy.context.collection.objects.link(key_obj)
    key_obj.rotation_euler = (math.radians(55), 0, math.radians(35))

    fill = bpy.data.lights.new("FillLight", "SUN")
    fill.energy = 1.2
    fill_obj = bpy.data.objects.new("FillLight", fill)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.rotation_euler = (math.radians(60), 0, math.radians(-120))

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.type = "ORTHO"
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    return cam_obj


def compute_world_bbox():
    """World-space bounding box of every mesh object currently in the scene."""
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            world_co = obj.matrix_world @ Vector(corner)
            mins.x, mins.y, mins.z = min(mins.x, world_co.x), min(mins.y, world_co.y), min(mins.z, world_co.z)
            maxs.x, maxs.y, maxs.z = max(maxs.x, world_co.x), max(maxs.y, world_co.y), max(maxs.z, world_co.z)
    return mins, maxs


def render_previews(avatar_id, cam_obj, out_dir):
    mins, maxs = compute_world_bbox()
    center = (mins + maxs) / 2
    size = maxs - mins
    # Orthographic scale = tallest/widest extent + margin, so every avatar (different
    # proportions/accessories) is framed consistently with headroom on all sides.
    ortho_scale = max(size.z, size.x, size.y) * 1.25
    cam_obj.data.ortho_scale = ortho_scale
    dist = max(size.length, 1.0) * 2
    angles = {"front": 0, "side": 90, "back": 180}
    for label, deg in angles.items():
        rad = math.radians(deg)
        cam_obj.location = center + Vector((dist * math.sin(rad), -dist * math.cos(rad), 0))
        direction = center - cam_obj.location
        cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        bpy.context.scene.render.filepath = os.path.join(out_dir, f"{avatar_id}-{label}.png")
        bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------------------
# Build one avatar end-to-end
# ---------------------------------------------------------------------------


def build_avatar(avatar_id):
    cfg = CHARACTERS[avatar_id]
    clear_scene()

    body = build_body_mesh(cfg)
    face = build_face_features(cfg)
    hair = build_hair(cfg["hair_style"], cfg["hair"])
    clothing = build_clothing(cfg)
    accessories = build_accessory(cfg)

    # Join skin + eyebrows + mouth (deforming, skin-colored/dark small features) into Body;
    # eyes/eyelids/hair/clothing/accessories stay separate for material clarity and (for
    # rigid bits) bone-parenting, then get vertex-group-bound to the armature too so they
    # still follow skinned deformation for hair/clothing.
    mouth_center = face["mouth"].location.copy()
    body = join_objects([body] + face["brows"] + [face["mouth"]], "Body")
    # mouth/brows already carried their own materials; re-split isn't needed since glTF
    # export supports multi-material meshes via material slots, which join preserves.
    add_shape_keys(body, mouth_center, mouth_radius=0.09, lid_objs_info=None)
    add_eyelid_blink(face["lids"])

    deforming = [body, hair, clothing["bottom"], clothing["shoes"]]
    if clothing["top"]:
        deforming.append(clothing["top"])
    deforming += face["eyes"] + face["lids"]
    if clothing.get("extras"):
        deforming += clothing["extras"]

    armature = build_armature()

    for obj in deforming:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        armature.select_set(True)
        bpy.context.view_layer.objects.active = armature
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    for obj, bone in accessories:
        bone_parent_object(obj, armature, bone)

    idle = bake_idle(armature)
    walk = bake_walk(armature)
    perform = bake_perform(armature)
    push_to_nla(armature, idle)
    push_to_nla(armature, walk)
    push_to_nla(armature, perform)
    armature.animation_data.action = None

    bpy.context.scene.frame_set(1)

    # Rename top-level objects for a clean outliner / clear glTF node names.
    armature.name = "Armature"

    # --- Export GLB to staging (NOT public/) — publish.py copies it over after verification ---
    os.makedirs(STAGING_DIR, exist_ok=True)
    glb_path = os.path.join(STAGING_DIR, f"{avatar_id}.glb")
    bpy.ops.object.select_all(action="SELECT")
    export_kwargs = dict(
        filepath=glb_path,
        export_format="GLB",
        use_selection=False,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_morph=True,
        export_yup=True,
        export_apply=True,
    )
    bpy.ops.export_scene.gltf(**export_kwargs)

    # --- Render QA-turnaround previews of the generated model (not concept reference art) ---
    # Force the rest pose for these stills: clearing animation_data.action does NOT stop the
    # pushed-down NLA tracks from still influencing the armature, so without this the preview
    # renders a blended/mid-animation pose instead of a clean neutral A-pose. This only affects
    # the renders below — the GLB was already exported above with its NLA tracks intact.
    armature.data.pose_position = "REST"
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    cam = setup_render()
    render_previews(avatar_id, cam, PREVIEW_DIR)

    # --- Save .blend source ---
    src_dir = avatar_src_dir(avatar_id)
    blend_path = os.path.join(src_dir, f"{avatar_id}.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)

    tri_count = sum(
        len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH"
    )
    return {
        "id": avatar_id,
        "glb_path": os.path.relpath(glb_path, REPO_ROOT),
        "blend_path": os.path.relpath(blend_path, REPO_ROOT),
        "glb_size_bytes": os.path.getsize(glb_path),
        "approx_polygons": tri_count,
        "bones": len(armature.data.bones),
        "clips": ["idle", "walk", "perform"],
    }


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    all_flag = "--all" in argv
    avatar = None
    if "--avatar" in argv:
        avatar = argv[argv.index("--avatar") + 1]
    return all_flag, avatar


def main():
    all_flag, avatar = parse_args()
    ids = list(CHARACTERS.keys()) if all_flag else [avatar]
    if not ids or ids == [None]:
        print("Usage: blender --background --python build.py -- --avatar <id> | --all")
        sys.exit(1)

    results = []
    for aid in ids:
        if aid not in CHARACTERS:
            print(f"Unknown avatar id: {aid}")
            continue
        print(f"=== Building {aid} ===")
        try:
            res = build_avatar(aid)
            results.append(res)
            print(f"OK: {aid} -> {res}")
        except Exception as e:  # noqa: BLE001
            import traceback

            traceback.print_exc()
            results.append({"id": aid, "error": str(e)})

    report_path = os.path.join(os.path.dirname(__file__), "_last_build_result.json")
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Wrote build result summary to {report_path}")


if __name__ == "__main__":
    main()
