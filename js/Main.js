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
			var posX=5*Math.cos(now/10);
			var posZ=5*Math.sin(now/10);
			this._camera.position.set(posX,3,posZ);
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
		var objLoader = new THREE.OBJLoader();
		// Free Model from turbosquid :
		// https://www.turbosquid.com/3d-models/real-time-wolf-3d-model/236013
		objLoader.load( 'models/wolf-obj.obj', ( object ) => {
			object.scale.multiplyScalar(0.1)
			object.position.x = -3 // Model not well centered
			object.traverse((child)=>{
				// child.material = new THREE.MeshBasicMaterial( {color: 0x880000} );
				child.material = applyShaderMaterial();
			})
			this.scene.add( object );
		});
		
		return;
		
		function applyShaderMaterial(){
			var material = new THREE.ShaderMaterial({
				uniforms: {
					time: { value: 1.0 },
					resolution: { value: new THREE.Vector2() }
				},
				vertexShader: APP.Shaders.getParticlesVertex(),
				fragmentShader: APP.Shaders.getParticlesFragment()

			});
			return material;
		}
	}
	// Add skybox 
	_addSkybox(){
		// https://stemkoski.github.io/Three.js/Skybox.html
		var imagePrefix = "skybox/thefog_";
		var directions  = ["lf", "rt", "up", "dn", "ft", "bk"];
		var imageSuffix = ".png";
		var skyGeometry = new THREE.CubeGeometry( 8, 8, 8 );	
		var textureLoader = new THREE.TextureLoader();

		var materialArray = [];
		for (var i = 0; i < 6; i++){
			materialArray.push( new THREE.MeshBasicMaterial({
				map: textureLoader.load( imagePrefix + directions[i] + imageSuffix ),
				side: THREE.BackSide
			}));
		}
		
		var skyMaterial = new THREE.MultiMaterial( materialArray );
		var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
		this.scene.add( skyBox );
	}
	_addLights(){
		// add ambient light
		var light	= new THREE.AmbientLight( 0x020202 );
		this.scene.add( light );
		// add a light in front
		var light	= new THREE.DirectionalLight('white', 1);
		light.position.set(0.5, 0.5, 2);
		this.scene.add( light );
		// add a light behind
		var light	= new THREE.DirectionalLight('white', 0.75);
		light.position.set(-0.5, -0.5, -2);
		this.scene.add( light );
	}
	onWindowResize(){
		var width  =  window.innerWidth;
		var height =  window.innerHeight;
		this._camera.aspect = width / height;
	        this._camera.updateProjectionMatrix();
		this._renderer.setSize( width, height );
	}
	
	
}