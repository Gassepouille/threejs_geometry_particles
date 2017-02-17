var APP = APP || {};

APP.Shaders = class Shaders {
	static getParticlesVertex(){
		return `void main() {
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
			}`;
	}
	static getParticlesFragment(){
		return `void main() {
				gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
			}`;
	}
}