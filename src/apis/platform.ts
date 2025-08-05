export function platform() {
    const isTablet = /Tablet|iPad/i.test(navigator.userAgent);
    const isMobile = !isTablet && /Mobi|Android/i.test(navigator.userAgent);
    const device = isTablet ? 'tablet' : isMobile ? 'phone' : 'desktop';
    const resolution = `${window.innerWidth}x${window.innerHeight}`;

    return {device, resolution};
}