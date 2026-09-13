export function toZipFileName(name: string, fallback = 'sound-mimic-model') {
    const safeName = name
        .trim()
        .split('')
        .map((character) => character.charCodeAt(0) < 32 ? '-' : character)
        .join('')
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, ' ')
        .replace(/[. ]+$/g, '');
    const baseName = safeName || fallback;
    return baseName.toLowerCase().endsWith('.zip') ? baseName : `${baseName}.zip`;
}

export function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
