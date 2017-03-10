var APP = APP || {};

APP.Main = class Main {
	constructor(domElement){
		this._container = domElement;
		// Renderer
		this._renderer  = new THREE.WebGLRenderer({
			antialias  : true,
			alpha    : true,
		});
		this._container.appendChild( this._renderer.domElement );
		// Camera + scene
		this._camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
	        this.scene = new THREE.Scene();
		
		// Engine
		this._engine = new APP.Engine();
		
		// render scene
		this._engine.onUpdateFcts.push((delta,now)=>{
			this._renderer.render( this.scene, this._camera );
		})
		
		// Move camera around center
		this._engine.onUpdateFcts.push((delta,now)=>{
			let posX=3*Math.cos(now/10);
			let posZ=3*Math.sin(now/10);
			this._camera.position.set(posX,2,posZ);
			this._camera.lookAt(new THREE.Vector3(0,0,0));
		})
		
		
		// resize
		this.onWindowResize();
		window.addEventListener('resize', ()=>{
	                this.onWindowResize();
	        }, false)
		
		
		this._addObject();
		this._addLights();
		this._addSkybox();
	}
	start(){
		this._engine.start();
	}
	stop(){
		this._engine.stop();
	}
	//////////////////////////////////////////////////////////////////////////////
	//              Where the Magic is supposed to happened
	//////////////////////////////////////////////////////////////////////////////
	
	_addObject(){
		let objLoader = new THREE.OBJLoader();
		// Free Model from turbosquid :
		// https://www.turbosquid.com/3d-models/real-time-wolf-3d-model/236013
		objLoader.load( 'models/wolf-obj.obj', ( object ) => {
			let group = new THREE.Group();
			group.scale.multiplyScalar(0.1);
			group.position.x = -3; // Model not well centered
			group.position.y = -0.5; // Model not well centered
			// Transformation to light magic
			object.traverse((child)=>{
				if(!child.geometry) return;
				// Add white ass geometry
				child.material = new THREE.MeshLambertMaterial({
					color:0xaaaaff,
					transparent:true,
					opacity:0.3,
					depthWrite:false,
					emissive:0xaaaaff,
					emissiveIntensity : 1,
				});
				// Add points cloud to make things pritty
				// let geometry = child.geometry;
				// let material = _applyShaderMaterial();
				// // Add size attribute (verticesNumber divided by 3, see bufferGeometry position attribute)
				// let verticesNumber = geometry.attributes.position.array.length/3;
				// let sizes = new Float32Array( verticesNumber );
				// for (var i = 0; i < sizes.length; i++) {
				// 	sizes[i] = 1;
				// }
				// geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
				// 
				// 
				// this._engine.onUpdateFcts.push((delta,now)=>{
				// 	for ( var i = 0; i < sizes.length; i++ ) {
				// 		geometry.attributes.size.array[ i ] = 1 + Math.sin(  i + now * 5 ) * 5;
				// 	}
				// 	geometry.attributes.size.needsUpdate = true;
				// })
				// let points = new THREE.Points( geometry2, material );
				// group.add(points);
				
				let material = _applyShaderMaterial();
				let geometry2 = new THREE.BufferGeometry();
				let number = child.geometry.attributes.position.count/10;
				let vertices = THREE.GeometryUtils.randomPointsInBufferGeometry(child.geometry,number);
				let positions = new Float32Array( vertices.length*3 );
				let sizes = new Float32Array( vertices.length );
				for (var i = 0, i3 = 0; i < vertices.length; i++, i3+=3) {
					sizes[i] = 1;
					positions[i3+0] = vertices[i].x;
					positions[i3+1] = vertices[i].y;
					positions[i3+2] = vertices[i].z;
				}
				geometry2.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
				geometry2.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
				this._engine.onUpdateFcts.push((delta,now)=>{
					for ( var i = 0; i < sizes.length; i++ ) {
						geometry2.attributes.size.array[ i ] = 1 + Math.sin(  i + now * 5 ) * 5;
					}
					geometry2.attributes.size.needsUpdate = true;
				})
				let points = new THREE.Points( geometry2, material );
				group.add(points);
			})
			
			group.add(object);
			this.scene.add( group );
		});
		
		return;
		
		function _applyShaderMaterial(){
			let material = new THREE.ShaderMaterial({
				uniforms: {
					// amplitude: { value: 0.7 },
					color:     { value: new THREE.Color( 0x0020ff ) },
					texture:   { value: new THREE.TextureLoader().load( "imgs/spark1.png" ) }
				},
				vertexShader: APP.Shaders.getParticlesVertex(),
				fragmentShader: APP.Shaders.getParticlesFragment(),
				blending : THREE.AdditiveBlending,
				depthWrite : false,
				transparent : true,

			});
			return material;
		}
	}
	//////////////////////////////////////////////////////////////////////////////
	//              End of magic
	//////////////////////////////////////////////////////////////////////////////
	
	// Add skybox 
	_addSkybox(){
		// https://stemkoski.github.io/Three.js/Skybox.html
		let imagePrefix = "skybox/thefog_";
		let directions  = ["lf", "rt", "up", "dn", "ft", "bk"];
		let imageSuffix = ".png";
		let skyGeometry = new THREE.CubeGeometry( 8, 8, 8 );	
		let textureLoader = new THREE.TextureLoader();

		let materialArray = [];
		for (var i = 0; i < 6; i++){
			materialArray.push( new THREE.MeshBasicMaterial({
				map: textureLoader.load( imagePrefix + directions[i] + imageSuffix ),
				side: THREE.BackSide
			}));
		}
		
		let skyMaterial = new THREE.MultiMaterial( materialArray );
		let skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
		this.scene.add( skyBox );
	}
	_addLights(){
		// add ambient light
		let lightAmbient	= new THREE.AmbientLight( 0x020202 );
		this.scene.add( lightAmbient );
		// add a light in front
		let lightDirectional1	= new THREE.DirectionalLight('white', 1);
		lightDirectional1.position.set(0.5, 0.5, 2);
		this.scene.add( lightDirectional1 );
		// add a light behind
		let lightDirectional2	= new THREE.DirectionalLight('white', 0.75);
		lightDirectional2.position.set(-0.5, -0.5, -2);
		this.scene.add( lightDirectional2 );
	}
	onWindowResize(){
		let width  =  window.innerWidth;
		let height =  window.innerHeight;
		this._camera.aspect = width / height;
	        this._camera.updateProjectionMatrix();
		this._renderer.setSize( width, height );
	}
	
	
}