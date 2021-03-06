const WIDTH = window.innerWidth, 
	  HEIGHT = window.innerHeight;

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 300, 700);

const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

const VIEW_ANGLE = 45,
	  ASPECT = WIDTH / HEIGHT,
	  NEAR = 0.1,
	  FAR = 10000;

var sunMesh, sunLight;
var mercury, venus, earth, mars, jupiter;
var planets;

var segments = 16,
	rings = 16;

var container, renderer, camera, scene;
var cameraTarget = new THREE.Vector3();
var renderStats, controls;

var backgroundTexture, backgroundMesh;
var backgroundScene, backgroundCamera;

var tweening = false;


function init() {

	//INIT PLANETS
	mercury = new Planet("mercury", MERCURY_RADIUS, MERCURY_ECCENTRICITY, MERCURY_PERIHELION);
	venus = new Planet("venus", VENUS_RADIUS, VENUS_ECCENTRICITY, VENUS_PERIHELION);
	earth = new Planet("earth", EARTH_RADIUS, EARTH_ECCENTRICITY, EARTH_PERIHELION);
	mars = new Planet("mars", MARS_RADIUS, MARS_ECCENTRICITY, MARS_PERIHELION);
	jupiter = new Planet("jupiter", JUPITER_RADIUS, JUPITER_ECCENTRICITY, JUPITER_PERIHELION);


	planets = [mercury, venus, earth, mars, jupiter];

	//INIT SCENE
	container = $("#container");

	renderer = new THREE.WebGLRenderer();
	camera = new THREE.PerspectiveCamera( 
					VIEW_ANGLE,
					ASPECT,
					NEAR,
					FAR );
	scene = new THREE.Scene();
	scene.add(camera);

	camera.position.copy(DEFAULT_CAMERA_POS);

	cameraTarget.copy(DEFAULT_TARGET);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.noPan = true;
	controls.noZoom = true;

	rendererStats   = new THREEx.RendererStats();
	rendererStats.domElement.style.position = 'absolute';
	rendererStats.domElement.style.left = '0px';
	rendererStats.domElement.style.bottom   = '0px';
	document.body.appendChild( rendererStats.domElement );

	renderer.setSize( WIDTH, HEIGHT );
	document.body.appendChild( renderer.domElement );

}

function initBackground() {
	backgroundTexture = THREE.ImageUtils.loadTexture( 'img/bg.jpg' );

	backgroundMesh = new THREE.Mesh(
		new THREE.SphereGeometry(800, 32, 32),
		new THREE.MeshBasicMaterial( { map: backgroundTexture } )
	);

	backgroundMesh.scale.x = -1;

	scene.add(backgroundMesh);
}

function createPlanetMeshes() {


	var texture, material, p;
	for(var i=0; i<planets.length; i++) {
		texture = THREE.ImageUtils.loadTexture('img/'+planets[i].name+".jpg", {}, function() {
			renderer.render(scene, camera);
		});
		texture.needsUpdate = true;
		material = new THREE.MeshLambertMaterial( { map: texture });

		p = new THREE.Mesh( new THREE.SphereGeometry (
								planets[i].radius,
								segments,
								rings),
								material
							);

		planets[i].mesh = p;

		scene.add(planets[i].mesh);

	}
}

function createSunMesh() {

	var texture, material;

	texture = THREE.ImageUtils.loadTexture('img/sun.jpg', {}, function() {
		renderer.render(scene, camera);
	});
	material = new THREE.MeshBasicMaterial( { map: texture });

	sunMesh = new THREE.Mesh( new THREE.SphereGeometry(
									Planet.SUN_RADIUS,
									segments,
									rings),
									material
							);

	scene.add(sunMesh);


	//SUN LIGHT SOURCE
	sunLight = new THREE.PointLight(0xFFFFFF, 2.5);
	scene.add(sunLight);

}

init();
initBackground();
createPlanetMeshes();
createSunMesh();

//ROTATE & ORBIT PLANETS
function updatePlanets( toMove ) {
	for(var i=0; i<planets.length; i++) {
		planets[i].update( toMove );
	}
}

function spinPlanets() {
	for(var i=0; i<planets.length; i++) {
		planets[i].spin();
	}
}

//PICK OBJECTS
var target = null;
var ray = new THREE.Raycaster();
var projector = new THREE.Projector();
var directionVector = new THREE.Vector3();
 
var clickInfo = {
  x: 0,
  y: 0,
  userHasClicked: false
};

renderer.domElement.addEventListener('click', function (evt) {
  clickInfo.userHasClicked = true;
  clickInfo.x = evt.clientX;
  clickInfo.y = evt.clientY;
}, false);

var x, y;

function checkClick() {

	if(target != null) {
		target = null;

		var duration = 5 * camera.position.distanceTo(DEFAULT_CAMERA_POS);
		console.log("DEFAULT_TARGET: "+DEFAULT_TARGET.x+" "+DEFAULT_TARGET.y+" "+DEFAULT_TARGET.z);
		tweenTo(DEFAULT_CAMERA_POS, duration, DEFAULT_TARGET);
		return;
	}
	
	x = ( clickInfo.x / WIDTH ) * 2 - 1;
	y = -( clickInfo.y / HEIGHT ) * 2 + 1;

	directionVector.set(x, y, 1);
	directionVector.unproject(camera);
	directionVector.sub(camera.position);
	directionVector.normalize();

	ray.set(camera.position, directionVector);

	var intersects = ray.intersectObjects(scene.children);
	if (intersects.length) {

	    var clicked = intersects[0].object;

	    for(var i=0; i<planets.length; i++) {
	    	var p = planets[i];
	    	if(p.mesh == clicked) {
	    		
	    		target = p;
	    		
	    		var viewpoint = p.getViewpoint();
	    		//console.log("before: "+viewpoint.x+" "+viewpoint.y+" "+viewpoint.z);
	    		var duration = 5 * camera.position.distanceTo(viewpoint);
	    		tweenTo(viewpoint, duration, p.mesh.position);
	    	}
	    }
	    
	}

	clickInfo.userHasClicked = false;
}

var pos, source, sourceTarget;
//ZOOM IN ON CLICKED PLANET & TWEEN CAMERA TARGET
function tweenTo( destination, duration, lookAt) {
	tweening = true;
	console.log("lookAt: "+lookAt.x+" "+lookAt.y+" "+lookAt.z);

	pos = camera.position;
	source = { x: pos.x, y: pos.y, z: pos.z };
	sourceTarget = { x: cameraTarget.x, y: cameraTarget.y, z: cameraTarget.z };
	console.log("camera target before: "+sourceTarget.x+" "+sourceTarget.y+" "+sourceTarget.z);

	new TWEEN.Tween( source )
        .to( destination, duration )
        .delay( 0 )
        .easing( TWEEN.Easing.Quartic.InOut )
        .onUpdate ( function()
            {
                camera.position.copy( source );
            })
        .onComplete( function() {
        	tweening = false;
        })
        .start();

    new TWEEN.Tween(sourceTarget)
    	.to(lookAt, duration)
    	.easing(TWEEN.Easing.Quartic.InOut)
    	.onUpdate(function () {
    		cameraTarget.copy(sourceTarget);
    		//console.log("updating");
		})
		.onComplete(function () {
		    console.log("camera target after: "+cameraTarget.x+" "+cameraTarget.y+" "+sourceTarget.z);
		}).start();

	
}


function onMouseWheel(event) {
	if (event.wheelDeltaY) { // WebKit
		camera.fov -= event.wheelDeltaY * 0.05;
	} else if (event.wheelDelta) { // Opera / IE9
		camera.fov -= event.wheelDelta * 0.05;
	} else if (event.detail) { // Firefox
		camera.fov += event.detail * 1.0;
	}

	camera.fov = Math.max(20, Math.min(100, camera.fov));
	camera.updateProjectionMatrix();
}

document.addEventListener('mousewheel', onMouseWheel, false);
document.addEventListener('DOMMouseScroll', onMouseWheel, false);


//RENDER SCENE
function render() {
	requestAnimationFrame( render );

	spinPlanets();
	var toMove = !tweening || target == null; // only stop orbiting planets if 
											  // tweening TO a planet

	updatePlanets( toMove );

	if(!tweening) {

		if(target != null) {
			var viewpoint = target.getViewpoint();
			camera.position.set(viewpoint.x, viewpoint.y, viewpoint.z);
			cameraTarget.copy(target.mesh.position);
		}

	}
	
	

	if(clickInfo.userHasClicked) {
		checkClick();
	}
	
	camera.lookAt(cameraTarget);
	
	renderer.autoClear = false;
	renderer.clear();
	renderer.render( scene, camera );

	TWEEN.update();
	controls.update();
	rendererStats.update(renderer);

}
render();




