var APP = APP || {};

APP.Shaders = class Shaders {
	static getParticlesVertex(){
		return `
		uniform float amplitude;
		
		void main() {
			vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
			gl_PointSize = amplitude *  -mvPosition.z ;
			gl_Position = projectionMatrix * mvPosition;
		}
		`;
	}
	static getParticlesFragment(){
		return `
		uniform vec3 color;
		uniform sampler2D texture;
		
		void main() {
			gl_FragColor = vec4( color, 1.0 );
			gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );;
		}
		`;
	}
}