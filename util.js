export const degToRad = Math.PI / 180;
export const radToDeg = 180 / Math.PI;

export const isRightMouse = (event) => {
	return (event.which === 3 || event.button === 2);
}
