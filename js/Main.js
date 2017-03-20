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
		this.scene.fog = new THREE.FogExp2( 0xb4c9ed, 0.15 );
		
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
			let particleNumber = 500;
			let group = new THREE.Group();
			group.scale.multiplyScalar(0.1);
			group.position.x = -3; // Model not well centered
			group.position.y = -0.5; // Model not well centered
			// Transformation to light magic
			let geometries = [];
			object.traverse((child)=>{
				if(!child.geometry) return;
				// Add white ass geometry
				child.material = new THREE.MeshPhongMaterial({
					color:0xaaaaff,
					transparent:true,
					opacity:0.3,
					depthWrite:false,
					emissive:0xaaaaff,
					emissiveIntensity : 1,
				});
				geometries.push(child.geometry.clone());
			})
			//////////////////////////////////////////////////////////////////////////////
			//              Make things pritty
			//////////////////////////////////////////////////////////////////////////////
			
			// Trick to get proper attributes for buffer geometry merge
			let geoBuffer = new THREE.BufferGeometry();
			let geometryTemp = new THREE.Geometry();
			for (var i = 0; i < geometries.length; i++) {
				let geometry = new THREE.Geometry().fromBufferGeometry(geometries[i]);
				geometryTemp.merge(geometry);
			}
			geoBuffer.fromGeometry(geometryTemp)
						
			//////////////////////////////////////////////////////////////////////////////
			//              Create spline to move around model
			//////////////////////////////////////////////////////////////////////////////
			
			let pointsNumber = 100;
			let pointsSpline = [];
			let faces = geometryTemp.faces;
			let randomIndex = null;
			for (var i = 0; i < pointsNumber; i++) {
				if(randomIndex === null) randomIndex = Math.ceil(Math.random()*(faces.length - 1));
				let point = THREE.GeometryUtils.randomPointInFace( faces[randomIndex], geometryTemp);
				point.add(faces[randomIndex].normal.multiplyScalar(1))
				pointsSpline.push(point);
				randomIndex+=1;
			}
			// var curve = new THREE.SplineCurve(pointsSpline);
			let curve = new THREE.CatmullRomCurve3(pointsSpline);
			
			let geometry3 = new THREE.BoxBufferGeometry( 0.5, 0.5, 0.5 );
			let material3 = new THREE.MeshBasicMaterial( {color: 0xff0000} );
			let cube = new THREE.Mesh( geometry3, material3 );
			group.add( cube );
			console.log(curve)
			var looptime = 10;
			this._engine.onUpdateFcts.push((delta,now)=>{
				
				let t = ( now % looptime ) / looptime;
				// Animate cube around spline
				let coord = curve.getPointAt( t );
				cube.position.copy(coord)
			});
			
			
			
			
			
			
						
			// Create points geometry
			let material = _applyShaderMaterial();
			let geometryPoints = new THREE.BufferGeometry();
			
			let vertices = THREE.GeometryUtils.randomPointsInBufferGeometry(geoBuffer,particleNumber);
			let positions = new Float32Array( vertices.length*3 );
			let sizes = new Float32Array( vertices.length );
			for (var i = 0, i3 = 0; i < vertices.length; i++, i3+=3) {
				sizes[i] = 1;
				positions[i3+0] = vertices[i].x;
				positions[i3+1] = vertices[i].y;
				positions[i3+2] = vertices[i].z;
			}
			geometryPoints.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
			geometryPoints.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
			
			// Update attributes
			this._engine.onUpdateFcts.push((delta,now)=>{
				for ( var i = 0; i < sizes.length; i++ ) {
					geometryPoints.attributes.size.array[ i ] = 1 + Math.sin(  i + now * 5 ) * 5;
				}
				geometryPoints.attributes.size.needsUpdate = true;
			})
			
			// Create points object and add to group
			let points = new THREE.Points( geometryPoints, material );
			group.add(points);
			
			//////////////////////////////////////////////////////////////////////////////
			//             Add ghost like form
			//////////////////////////////////////////////////////////////////////////////

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