# SoundMimic — Spec avatar chính thức

**Phiên bản:** 1.0
**Phạm vi:** 10 nhân vật, đặc điểm nhận diện, thứ tự chọn avatar, quy ước tên file và tiêu chí bàn giao.
**Trạng thái:** Tài liệu thiết kế. Gói này KHÔNG có model GLB, rig hay animation đã xuất/kiểm thử.

## 1. Thứ tự và tên đã khóa

| Cột | Hàng 1 — nam  | Hàng 2 — nữ     |
| --- | ------------- | --------------- |
| 1   | Leo (`leo`)   | Hana (`hana`)   |
| 2   | Liam (`liam`) | Zoe (`zoe`)     |
| 3   | Noah (`noah`) | Aisha (`aisha`) |
| 4   | Kai (`kai`)   | Emma (`emma`)   |
| 5   | Hung (`hung`) | Maya (`maya`)   |

(Hàng nữ đã đổi cột 1↔5 so với bản trước: `public/assets/student-avatars.png` được người dùng upload lại với thứ tự Maya/Hana hoán đổi — Zoe/Aisha/Emma giữ nguyên cột 2–4.)

**Hung là tên chính thức của avatar tóc đen, hoodie xanh mở khóa, áo thun trắng có ngôi sao. Không dùng Jin làm tên hiển thị mới.** `jin` chỉ là alias cũ để xử lý tham chiếu avatar cũ khi thực sự cần; không tự đổi tên người chơi hoặc sửa dữ liệu người dùng có nickname Jin.

Cặp theo cột chỉ phục vụ bố cục lựa chọn. Không hàm ý quan hệ gia đình, không dùng màu da/tóc để gán quốc tịch và không giới hạn ai được chọn avatar nào.

### Nguồn tham chiếu và thứ tự ưu tiên

1. Tên cuối cùng người dùng đã chốt trong bảng trên.
2. `references/avatar-lineup.png`: diện mạo, tóc, phụ kiện và phần áo của bộ 10 avatar hiện tại.
3. `references/hung-character-sheet.png`: bổ sung toàn thân cho Hung. Hình wireframe, rig và chữ "GLB" trên sheet chỉ là minh họa, KHÔNG chứng minh đã có asset thật.
4. Các phần ghi **ĐỀ XUẤT** bên dưới là chi tiết chưa đủ rõ hoặc chưa thấy trong ảnh. Phải duyệt trước khi khóa model.

Các mã màu HEX là swatch khởi điểm để trao đổi thiết kế, không phải màu texture được đo chính xác từ ảnh (ngoại trừ palette Hung, được đo trực tiếp từ ô "Color Palette" của character sheet). Ưu tiên khớp hình ảnh dưới cùng điều kiện ánh sáng, tránh sao chép highlight/shadow vào base color.

## 2. Chuẩn chung cho cả bộ

### Diện mạo

- 3D cartoon bán hiện thực, mềm và tự nhiên theo bộ chân dung cuối cùng. Không làm đầu/mắt quá lớn hơn ảnh và không thay bằng capsule/dummy.
- Cảm giác tuổi 10–12 là mục tiêu tạo hình. Các bạn có chiều cao và độ chi tiết tương đương; không suy ra tính cách hoặc năng lực từ diện mạo.
- Giữ tóc có cấu trúc, quần áo có độ dày và nếp gấp vừa đủ, mặt không bị bóng như nhựa. Tránh chi tiết quá dày làm các avatar mất đồng nhất khi lên sân khấu.
- Model cơ sở có mắt mở, nụ cười nhẹ, tay không cầm vật. Nụ cười nhắm mắt trong một số thumbnail là biểu cảm, không phải hình dạng mắt duy nhất.
- Outfit mặc định và phụ kiện nhận diện phải được giữ. Chưa xây hệ thống mix-and-match ở giai đoạn này.

### Toàn thân và hình tham chiếu cần bổ sung

Mỗi nhân vật cần một bản toàn thân chính diện ở A-pose trung tính, một ảnh bên hông và một ảnh sau lưng. Tay tách khỏi thân, chân tách nhẹ, đầu và giày không bị crop. Dùng cùng quần áo/tóc ở mọi góc, nền đơn giản, không có micro hoặc sân khấu gộp vào ảnh đầu vào dựng model.

Chiều cao chuẩn hóa **đề xuất** trong scene là 1,35 m cho bản đầu; điều chỉnh adapter cho phù hợp scene hiện có, không xem đây là số đo sinh học. Gốc nhân vật ở mặt sàn, giữa hai chân. Hướng quay và trục phải thống nhất theo scene; ghi lại mapping thực tế thay vì tự xoay từng model tùy ý.

### Rig và animation mong muốn

| Trạng thái ứng dụng         | Yêu cầu                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `idle`                      | Đứng chờ, thở/cử động rất nhẹ, loop không giật.                                         |
| `walk`                      | Đi bộ có bước chân và tay đối xứng; dùng cho cả đi tới mic và đi về sau khi xoay hướng. |
| `perform`                   | Đứng yên tại vị trí biểu diễn, cử chỉ tay/đầu nhẹ, không tự trượt khỏi vị trí.          |
| `wave`, `cheer`, `thinking` | Tùy chọn, chưa bắt buộc trong bản đầu.                                                  |

Đây là tên **trạng thái ứng dụng**, không phải cam kết tên clip trong GLB. Phải đọc asset thật rồi ánh xạ tên clip. Không bắt buộc clip riêng `walk_back`; có thể xoay nhân vật và dùng lại `walk`.

Mouth-open và blink là yêu cầu mong muốn cho facial controls, cần kiểm tra riêng. Có body rig không có nghĩa đã có facial rig. Nếu chỉ có cử động cơ thể, ghi rõ giới hạn; không gọi đó là lip-sync chính xác.

Giữ micro thuộc sân khấu, không gắn cứng vào tay/model. Canh đầu micro gần miệng nhân vật ở vị trí perform; không đặt theo một giá trị cố định khi các model chưa được chuẩn hóa.

## 3. Spec từng nhân vật

### 01. Leo — `leo`

**Vị trí:** hàng 1, cột 1. **Cặp hiển thị:** Hana.
**Nhận diện chính:** Tóc nâu bồng, hoodie xanh dương mặc kín, dây rút trắng.
**Palette:** skin `#E6B08B` · hair `#70402D` · eyes `#34221A` · top `#2479D9` · trim `#F5F3EF` · bottom `#C2A582`.
**Ghi chú:** Leo và Hung đều có màu xanh dương, nhưng phải phân biệt bằng tóc và cấu trúc áo (Leo tóc nâu/hoodie kín, Hung tóc đen/hoodie mở lộ áo sao).

### 02. Liam — `liam`

**Vị trí:** hàng 1, cột 2. **Cặp hiển thị:** Zoe.
**Nhận diện chính:** Tóc vàng ngắn, mắt xanh, tai nghe đen quanh cổ, áo trắng tay xanh.
**Palette:** skin `#F0CBAA` · hair `#E7B554` · eyes `#3274A5` · top `#F4F2EE` · sleeves `#3B74C6` · headphones `#292A30` · bottom `#697653`.
**Ghi chú:** Tai nghe đeo QUANH CỔ (khác Maya, đeo trên đầu) — dấu hiệu nhận diện chính.

### 03. Noah — `noah`

**Vị trí:** hàng 1, cột 3. **Cặp hiển thị:** Aisha.
**Nhận diện chính:** Da nâu, tóc xoăn ngắn, hoodie xanh lá.
**Palette:** skin `#A7653E` · hair `#2E1D16` · eyes `#302016` · top `#1A976A` · trim `#F0EEE6` · bottom `#34363C`.

### 04. Kai — `kai`

**Vị trí:** hàng 1, cột 4. **Cặp hiển thị:** Emma.
**Nhận diện chính:** Tóc đỏ/cam, mũ bóng chày xanh–trắng, hoodie đỏ.
**Palette:** skin `#EFC6A9` · hair `#BC5B2D` · eyes `#3B78A5` (đề xuất) · top `#D84A45` · capBlue `#236BCB` · capWhite `#F4F2EC` · bottom `#35373D`.

### 05. Hung — `hung`

**Vị trí:** hàng 1, cột 5. **Cặp hiển thị:** Maya.
**Nhận diện chính:** Tóc đen, hoodie xanh mở khóa, áo thun trắng có ngôi sao xanh giữa ngực.
**Palette (đo từ character sheet):** skin `#F6C9AB` · hair `#2D2A28` · top/hoodie `#1E63E9` · shirt `#FFFFFF` · star `#2563EB` · pants `#374151` · shoesDark `#1F2937` · shoesLight `#60A5FA`.
**Không thay thế:** Không đổi tên thành Jin. Không đóng kín áo làm mất ngôi sao.
**Ghi chú:** Đây là nhân vật xây pipeline đầu tiên — mọi nhân vật khác tái sử dụng skeleton/pipeline của Hung.

### 06. Maya — `maya`

**Vị trí:** hàng 2, cột 5. **Cặp hiển thị:** Hung.
**Nhận diện chính:** Tóc đen dài, tai nghe tím đội TRÊN ĐẦU, hoodie tím có trái tim nhỏ.
**Palette:** skin `#E8B792` · hair `#272130` · eyes `#35231C` · top `#9560D1` · headphones `#8752CC` · heart `#DCC4F1` · bottom `#B99BDD`.

### 07. Zoe — `zoe`

**Vị trí:** hàng 2, cột 2. **Cặp hiển thị:** Liam.
**Nhận diện chính:** Tóc vàng dài, mắt xanh, hoodie màu san hô.
**Palette:** skin `#F0C7A8` · hair `#E6B75C` · eyes `#3F7BA6` · top `#ED8B7D` · trim `#F8F3EB` · bottom `#91B5D4`.

### 08. Aisha — `aisha`

**Vị trí:** hàng 2, cột 3. **Cặp hiển thị:** Noah.
**Nhận diện chính:** Da nâu, tóc xoăn dài, băng đô vàng, áo vàng và yếm jean.
**Palette:** skin `#AA6C45` · hair `#35231D` · eyes `#372318` · top `#F1C541` · headband `#F6D354` · denim `#4D7FAC` · buttons `#DDB54E`.

### 09. Emma — `emma`

**Vị trí:** hàng 2, cột 4. **Cặp hiển thị:** Kai.
**Nhận diện chính:** Tóc đỏ dài, kính tròn đen, hoodie vàng.
**Palette:** skin `#F0C6AC` · hair `#CA622F` · eyes `#657A90` · top `#F0BE43` · glasses `#29292D` · bottom `#5E85B0`.

### 10. Hana — `hana`

**Vị trí:** hàng 2, cột 1. **Cặp hiển thị:** Leo.
**Nhận diện chính:** Tóc nâu dài, mũ len gấu màu kem, áo trắng và yếm jean.
**Palette:** skin `#EDC3A5` · hair `#3A2824` · eyes `#3A2419` · hat `#F1E5D5` · top `#F7F3EC` · denim `#658FB8` · bear `#BC8C62`.

Đặc tả chi tiết đầy đủ (khuôn mặt, tóc, áo, phụ kiện, preserve/avoid từng mục) nằm trong `avatar-manifest.json` — file này là bản tóm tắt máy đọc thân thiện hơn cho việc lập trình pipeline; manifest là nguồn có thẩm quyền khi hai file lệch nhau.

## 4. Naming và lưu dữ liệu

- Tách `avatarId` (ví dụ `hung`) khỏi `playerId`, nickname hiển thị, quyền host và model classifier của người chơi.
- Nickname người chơi có thể trùng chữ với avatarId (vd. người tên "Trang" chọn avatar `hung`); không đổi tên asset theo nickname.
- Tên hiển thị viết đúng Leo, Liam, Noah, Kai, Hung, Maya, Zoe, Aisha, Emma, Hana. ID/file dùng chữ thường, không dấu.
- Migration `jin` → `hung`: đã áp dụng trong `src/data/profile.ts`, `src/features/play/avatarAssets.ts`, `src/styles.css`. `jin` giữ vai trò legacy alias trong manifest, không dùng làm avatarId sống trong runtime.
- Bản Zoe hiện tại là tóc vàng và hoodie san hô. Bản Kai hiện tại là tóc đỏ. Không trộn với các concept cũ.
- `null` trong `animationClipMap` nghĩa là CHƯA KIỂM TRA, không phải cố tình không có animation.

## 5. Quy ước file bàn giao

```text
docs/avatars/
├── AVATAR_SPEC.md
├── avatar-manifest.json
├── BUILD_REPORT.md
├── previews/
│   └── {id}-front.png / {id}-side.png / {id}-back.png
└── references/
    ├── avatar-lineup.png
    └── hung-character-sheet.png
```

```text
public/assets/avatars/
├── leo.glb    liam.glb    noah.glb    kai.glb    hung.glb
├── maya.glb   zoe.glb     aisha.glb   emma.glb   hana.glb
```

```text
assets-src/avatars/
└── {id}.blend   (Blender source, giữ để chỉnh sửa sau)
```

Thumbnail cuối cùng (khi có): vuông 1:1, đầu–vai, nền xanh nhạt, cỡ mặt và khoảng trống phía trên nhất quán.

## 6. Tiêu chí duyệt một model thật

Duyệt Hung trước, rồi mới mở rộng các bạn khác. Một model chỉ được đánh dấu sẵn sàng khi đã kiểm tra:

1. Khuôn mặt, tóc, màu da, áo và phụ kiện khớp reference tương ứng; quần/giày đề xuất đã được người dùng duyệt.
2. Mesh và texture tải được; phần sau đầu/lưng không lỗi hình hoặc texture.
3. Rig và animation thực sự tồn tại; mapping `idle` / `walk` / `perform` được ghi theo tên clip thật.
4. Chân chạm sàn, scale hợp lý, đi bộ không trượt quá mức; chuyển trạng thái không giật, xuyên người hoặc đổi identity.
5. Tóc, tai nghe, kính, mũ và yếm không xuyên vào cơ thể rõ rệt khi đi hoặc perform.
6. Model quay về đúng vị trí cũ; micro gần miệng và không che toàn bộ mặt.
7. Nếu có facial controls, mouth/blink thực sự hoạt động. Nếu không có, giới hạn được ghi rõ.
8. Ghi số polygon, kích thước file và kiểm tra hiệu năng trên sân khấu thực tế. Không tự công bố "60 FPS", "rigged", "game-ready" hoặc "production-ready" khi chưa kiểm thử.
9. Ghi nguồn asset, giấy phép/quyền sử dụng thực tế và những chỉnh sửa đã làm.

## 7. Ràng buộc cho pipeline dựng model

Không tạo model procedural/capsule thay cho thiết kế được duyệt. Không coi ảnh PNG, hình wireframe trên poster hoặc tên file trong tài liệu là bằng chứng đã có GLB/rig thật. Nếu thiếu asset, ghi trạng thái thiếu trung thực và giữ các bước tích hợp có thể thực hiện sau.

Khi một task tương lai liên quan avatar bắt đầu, đọc lại tài liệu này cùng manifest và ảnh tham chiếu. Mọi thay đổi tên, thứ tự, kiểu tóc, outfit hoặc palette lớn cần được người dùng duyệt rồi cập nhật đồng thời spec và manifest.
