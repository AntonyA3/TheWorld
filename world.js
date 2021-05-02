
var gl = null;
var ctx = null;
const MouseButtonState = {
    Pressed: 0,
    Down: 1,
    Released: 2,
    Up: 3,

}

const InteractionMode ={
    Move: 0,
    Picker: 1
}

function World(){
    this.interactionMode = InteractionMode.Move;
    this.canvas = document.getElementById("canvas")
    this.ctx = this.canvas.getContext("webgl");
    this.canvas2d = document.getElementById("canvas2d");
    this.ctx2d = this.canvas2d.getContext("2d");
    this.camera = {
        projectionMatrix: Matrix.identity(),
        viewMatrix: Matrix.identity(),
        position: [0, 0, 90],
        zoom: 1.0,
        orientation:[1,0,0,0],      
    }
    this.domElements = {
        xElement: document.getElementById("x-label"),
        yElement: document.getElementById("y-label"),
        zElement: document.getElementById("z-label"),
        catagoryElement: document.getElementById("catagory"),
        catagoryList: document.getElementById("catagoryList"),
        threadList: document.getElementById("threadList"),
        threadInList: [],
        selectedCatagoryName:document.getElementById("selected-catagory-name"),
        titleField: document.getElementById("title-field"),
        contentField: document.getElementById("content-field"),
        sendToWorldButton: document.getElementById("send-to-world-button"),
        catagoryButtons: []
    }
    this.programs ={
        phong:undefined,
        baseShader: undefined
    };
    this.mouseInput ={
        primaryMouseButton: {id: 0,state: MouseButtonState.Up},
        deltaPosition:[0,0],
        position:[-1,-1]
    },
    this.canvasCursor = {
        position:[0,0],
        overCanvas: false
    },
    this.viewportCursor ={
        position:[0,0]
    },
    this.sceneCursor = {
        position:[0,0,0],
        ray: {position:[0,0,0], direction:[0,0,-1]},
        hitManifold:undefined
    }
    this.planetImage = new Image();
    this.pins = {
        searchPin: {
            rect:{x: 32, y: 16, width:48, height:48}    
        },
        writePin:{
            rect:{x: 32, y: 64+16, width:48, height:48}
        }
    }
    this.pinModel = {
        verticies:[],
        indicies:[],
        texture: null,
        vbo: null,
        ebo: null
    }
    this.planet = {
        boundingSphere: {position:[0,0,0], radius: 50},
        scale: [50,50,50],
        position: [0,0,0],
        orientation:[1,0,0,0],
        modelMatrix:Matrix.identity(),
        model:{
            verticies:[],
            indicies:[],
            texture: null,
            vbo: null,
            ebo: null
        }
    }
    this.postCheckbox = document.getElementById("post-checkbox")

}

function main(){
    let world = new World();
    let elapsed = 1 / 60;
    let time = 0
    gl = world.ctx;
    ctx = world.ctx2d;

    let update = timestamp =>{
        updateWorld(world, elapsed);

        elapsed = (timestamp - time) * 0.001;
        time = timestamp;
        window.requestAnimationFrame(update);
    }
    initWorld(world);
    window.requestAnimationFrame(update);
        
}
function uvOnUnitSphere(point){
    let l =  Math.acos(point[0])
    let v = Math.acos(point[1])/ Math.PI
    let u = 0.5;
    if (v != 0 && v != 1){
        u = 180 * Math.atan2(point[2], point[0]) / Math.PI
        if(point[2] > 0){
            u = 180 + (180 - u)
        }
        u = Math.abs(u)/360;

    }
    return [u, v]


}
function createSphere(vertexArray,indexArray, longSegments, latSegments){
    for(var longitude = 0; longitude <= 180; longitude += 180 / longSegments){
        for(var latitude = 0; latitude <= 360; latitude += 360 / latSegments){
            let lat = latitude /180 * Math.PI;
            let lng = longitude / 180 * Math.PI;

            let x = Math.cos(lat) * Math.sin(lng);
            let y = Math.cos(lng);
            let z = -Math.sin(lat) * Math.sin(lng);

            let n = Vector3.normalize([x,y,z]);
            let uv = uvOnUnitSphere(n);
            vertexArray.push(x, y, z, n[0], n[1], n[2], uv[0], uv[1]);

        } 
        

    }
    for(var i = 0; i < longSegments; i++){
        for(var j = 0; j < latSegments; j++){
            indexArray.push(j + longSegments + 1    + (latSegments + 1) * i)
            indexArray.push(j + 1   + (latSegments + 1) * i)
            indexArray.push(j        + (latSegments + 1) * i)
 
            indexArray.push(j + longSegments + 1       + (latSegments + 1) * i)
            indexArray.push(j + longSegments +2     + (latSegments + 1) * i)
            indexArray.push(j + 1   + (latSegments + 1) * i)


        }    
    }

}

function initializeCatagoryList(world){
    let request = new XMLHttpRequest();
    request.open("GET", "get_topics.php")
    request.onreadystatechange = function(){
        if(this.readyState === XMLHttpRequest.DONE){
            if(this.status === 200){
                console.log(request.response)
                let data = JSON.parse(request.response);
                
                let list = world.domElements.catagoryList;

                data.forEach(topic =>{
                    let button = document.createElement("button");
                    button.value = topic.code;
                    button.title = topic.name;
                    button.textContent = topic.code;
                    world.domElements.catagoryButtons.push(button);
                    world.domElements.catagoryList.appendChild(button);
                });

                world.domElements.catagoryButtons.forEach(button =>{
                    button.onclick = e =>{
                        world.domElements.selectedCatagoryName.textContent = button.value;
                        world.domElements.catagoryElement.value = button.value;
                        list.style.visibility = "hidden"
                    }
                });
            }else{
                console.log("request failed")
            }
        }
        
    }
    request.send();
  

}
/*
function initializePinModel(world){
    let request = new XMLHttpRequest();
    request.open("GET", "pin.obj")
    request.onreadystatechange = function(){
        if(this.readyState === XMLHttpRequest.DONE){
            if(this.status === 200){
                let verticies = [];
                let normals = [];
                let indicies = [];
                let objData = request.response.split('\n');
                objData.forEach(row =>{
                   let columns = row.split(' ');
                   if(columns[0] == "v"){
                       verticies.push(
                        parseFloat(columns[1]),parseFloat(columns[2]),parseFloat(columns[3]),0,0,0
                       );
                   }
                   
                   if(columns[0] == "vn"){
                       normals.push(
                        [parseFloat(columns[1]),parseFloat(columns[2]),parseFloat(columns[3])]
                       );
                    }
                    if(columns[0] == "f"){
                        let cells = columns.slice(1);
                        if(columns.length == 4){
                            cells.forEach(cell =>{
                                cell = cell.split("//");
                                let vertexIndex  = cell[0] - 1;
                                indicies.push(vertexIndex);
                                let normalIndex = cell[1]-1;
                                let normal = normals[normalIndex];
                                verticies[3 * vertexIndex] = normal[0];
                                verticies[3 * vertexIndex + 1] = normal[1];
                                verticies[3 * vertexIndex + 2] = normal[2];
                            })
                        }
                    }

                });

                world.pinModel.verticies = verticies;
                world.pinModel.indicies = indicies;

                world.pinModel.vbo = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, world.pinModel.vbo);
                gl.bufferData(gl.ARRAY_BUFFER,
                    new Float32Array(world.pinModel.verticies),
                    gl.STATIC_DRAW);
            
                world.pinModel.ebo = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, world.planet.model.ebo);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                    new Uint16Array(world.pinModel.indicies),
                    gl.STATIC_DRAW);
                
            }else{
                console.log("request failed")
            }
        }   
    }
    request.send();
  


}*/
function initializeWorldEvents(world){
    document.onmousedown = e =>{
        let mouseInput = world.mouseInput;
        if(e.button === mouseInput.primaryMouseButton.id){
            let state = mouseInput.primaryMouseButton.state
            if(state === MouseButtonState.Down || state === MouseButtonState.Pressed){
                mouseInput.primaryMouseButton.state = MouseButtonState.Down
            }else{
                mouseInput.primaryMouseButton.state = MouseButtonState.Pressed
            }
        }
    }
    document.onmousemove = e =>{
        let mouseInput = world.mouseInput;
        mouseInput.position = [e.clientX, e.clientY];
        mouseInput.deltaPosition =[e.movementX, e.movementY];
    }
    document.onmouseup =  e =>{
        let mouseInput = world.mouseInput;
        if(e.button === mouseInput.primaryMouseButton.id){
            let state = mouseInput.primaryMouseButton.state
            if(state === MouseButtonState.Down || state === MouseButtonState.Pressed){
                mouseInput.primaryMouseButton.state = MouseButtonState.Released
            }else{
                mouseInput.primaryMouseButton.state = MouseButtonState.Up
            }
        }

    }
    let clampStringLength = e =>{
        let field = world.domElements.titleField
        let length = field.value.length;
        if (length > 50){
            field.value = field.value.substring(0, 50)
        }
    }
    world.domElements.titleField.oninput = e => clampStringLength(e)
    world.domElements.titleField.onchange = e => clampStringLength(e)

    world.domElements.contentField.oninput =  e =>{
        let field = world.domElements.contentField;
        if(length > 63206){
            field.value = field.value.substring(0, 63206)

        }

    }
    world.domElements.contentField.onchange = e =>{
        let field = world.domElements.contentField;
        if(length > 63206){
            field.value = field.value.substring(0, 63206 )
        }
    }
    world.domElements.catagoryList.style.visibility = "hidden";
    world.domElements.catagoryElement.onclick = e =>{
        let list = world.domElements.catagoryList;
        if(list.style.visibility != "hidden"){
            list.style.visibility = "hidden"
        }else{
            list.style.visibility = "visible"
        }     
    }

    world.domElements.catagoryButtons.forEach(button => {
        world.domElements.catagoryElement.value = button.value;
        world.domElements.selectedCatagoryName.innerText = button.value;
        
    });

    world.domElements.sendToWorldButton.onclick = e =>{
        createThread(world);
    }

    world.canvas.onmouseover = e =>{
        world.canvasCursor.overCanvas = true;
    }

    world.canvas.onmouseout = e =>{
        world.canvasCursor.overCanvas = false;
    }
    window.onresize = e =>{
        //world.canvas.width = 
    }
}

function clearPostBox(world){
    world.domElements.titleField.value = "";
    world.domElements.catagoryElement.value = "";
    world.domElements.contentField.value = "";
    world.domElements.latitudeElement.value =0;
    world.domElements.longitudeElement.value = 0;
}

function createThread(world){
    let x = world.domElements.xElement.value;
    let y = world.domElements.yElement.value;
    let z = world.domElements.zElement.value;
    let title = world.domElements.titleField.value;
    let topic = world.domElements.catagoryElement.value;
    let content = world.domElements.contentField.value;
    let timestamp = Date.now();


    let request = new XMLHttpRequest();
    let data = 'x=' + x + '&y=' + y + '&z=' + z +
    '&title=\'' + title + '\'&topic=\'' + topic +
    '\'&content=\'' + content + '\'&timestamp=' + timestamp;
    request.open("POST", "create_thread.php",true);
    request.onreadystatechange = function(){
        if(this.readyState === XMLHttpRequest.DONE){
            if(this.status === 200){
                console.log(request.response )
            }else{
                console.log("request failed")
            }
        }
    }
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send(data);

}

function viewportToRay(coord, near, cameraPosition, cameraMatrix, aspectRatio, fov){
    let halfFov = fov * 0.5;
    let tanFov = Math.tan(halfFov);
    let arTanFov = aspectRatio * tanFov;
    let forward = Vector3.scale(Matrix.zVector(cameraMatrix),-1 * near);
    let right = Vector3.scale(Matrix.xVector(cameraMatrix), arTanFov * coord[0] * 2);
    let up = Vector3.scale(Matrix.yVector(cameraMatrix), tanFov * coord[1] * 2);
    let position = Vector3.add(Vector3.add(cameraPosition, forward),Vector3.add(right, up));
    let ray = {position:[cameraPosition[0] , cameraPosition[1], cameraPosition[2]],direction: Vector3.normalize(Vector3.subtract(position,cameraPosition))};
    return ray;
}

function updateMouseInput(mouseInput){
    if(mouseInput.primaryMouseButton.state === MouseButtonState.Pressed){
        mouseInput.primaryMouseButton.state = MouseButtonState.Down;
    }else if(mouseInput.primaryMouseButton.state === MouseButtonState.Released){
        mouseInput.primaryMouseButton.state = MouseButtonState.Up;
    }
    mouseInput.deltaPosition = [0,0];
}
function initWorld(world){
    initializeCatagoryList(world)
    initializeWorldEvents(world);

    /**Initialise Phong Program */

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader,document.getElementById("phong-vertex-shader").textContent);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
    }
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader,document.getElementById("phong-fragment-shader").textContent);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
    }
    let phongProgram =  gl.createProgram();
    gl.attachShader(phongProgram, vertexShader);
    gl.attachShader(phongProgram, fragmentShader);
    gl.linkProgram(phongProgram);
  
  
    if (!gl.getProgramParameter(phongProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(phongProgram));
      return null;
    }else{
        world.programs.phong = {
            id:phongProgram,
            vertexAttributes:{
               vertex:gl.getAttribLocation(phongProgram, 'vertex'),
               vertexNormal:gl.getAttribLocation(phongProgram, 'vertexNormal'),
               uv:gl.getAttribLocation(phongProgram, "uv")
            },
            uniformAttributes:{
                projectionMatrix: gl.getUniformLocation(phongProgram, 'projectionMatrix'),
                modelMatrix: gl.getUniformLocation(phongProgram, 'modelMatrix'),
                viewMatrix: gl.getUniformLocation(phongProgram, 'viewMatrix'),
                texture0: gl.getUniformLocation(phongProgram, 'texture0')
            }
        }
        
    }

    /**Create Sphere */
    createSphere(world.planet.model.verticies, world.planet.model.indicies, 36, 36) 

    world.planet.model.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, world.planet.model.vbo);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(world.planet.model.verticies),
        gl.STATIC_DRAW);

    world.planet.model.ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, world.planet.model.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(world.planet.model.indicies),
        gl.STATIC_DRAW);

    
    world.planetImage = new Image();
    world.planetImage.onload = function(){
        world.planet.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, world.planet.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, world.planetImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.generateMipmap(gl.TEXTURE_2D);
        
    }
    world.planetImage.src = 'globeTexture.png';
    /**End Create SPhere */
    world.camera.projectionMatrix = Matrix.perspective(1.0, 100.0, world.canvas.width / world.canvas.height, Math.PI/2)
    
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK);
}

function rayToWorldPosition(world, ray){
    let sphere = world.planet.boundingSphere;
    let result = raySphereIntersection(sphere, ray);
    return result;
}

function raySphereIntersection(sphere, ray){
    let oMc= Vector3.subtract(ray.position, sphere.position);
    let b = 2 * (Vector3.dot(ray.direction, oMc));
    let c = Vector3.lengthSquared(oMc) - sphere.radius * sphere.radius;

    let determinant = b*b - 4*c;
    if(determinant < 0){
        return {hit: false,point:[0,0,0]}
    }else if(determinant == 0){
        let d = -b*0.5
        return {hit: true, distance: d, point: Vector3.add(ray.position,Vector3.scale(ray.direction, d))};
    }else if(determinant > 0){
        let d1 = (-b +Math.sqrt(determinant)) * 0.5;
        let d2 = (-b - Math.sqrt(determinant)) * 0.5;

        if(d1 < 0){
            return {hit: true, distance: d2, point: Vector3.add(ray.position,Vector3.scale(ray.direction, d2))};;
        }else if(d2 < 0){
            return {hit: true, distance: d1, point: Vector3.add(ray.position,Vector3.scale(ray.direction, d1))};;
        }else{
            let minD = Math.min(d1, d2);
            return {hit: true, distance: minD, point: Vector3.add(ray.position,Vector3.scale(ray.direction, minD))};;


        }
    }
}

function getThreads(world,point){
    let request = new XMLHttpRequest();
    request.open("GET", "get_threads.php?x=" +point[0] + "&y=" + point[1] + "&z=" + point[2]);
    request.onreadystatechange = function(){
        if(this.readyState === XMLHttpRequest.DONE){
            if(this.status === 200){
                console.log(request.response )
                let data = JSON.parse(request.response);
                while(world.domElements.threadList.hasChildNodes()){
                    world.domElements.threadList.removeChild(
                        world.domElements.threadList.childNodes[0]
                    );
                }
                data.forEach(thread =>{
                    let div = document.createElement("div");
                    div.textContent = thread.title;
                    world.domElements.threadList.appendChild(div); 

                });
            }else{
                console.log("request failed")
            }
        }
    }
    request.send();
}



function updateCameraMatrix(camera){
    
    let rotationMatrix = Matrix.fromQuarternion(Quarternion.inverse(camera.orientation));
    let scaleMatrix = Matrix.scale([camera.zoom, camera.zoom, 1.0]);
    let translationMatrix = Matrix.translation([-camera.position[0], -camera.position[1], -camera.position[2]]);
    camera.viewMatrix = Matrix.multiply(rotationMatrix,translationMatrix);
    camera.viewMatrix = Matrix.multiply(scaleMatrix,camera.viewMatrix)

}
function updateWorld(world, elapsed){

    let mouseInput = world.mouseInput;

    {
    let bounds = world.canvas.getBoundingClientRect();
    world.canvasCursor.position =[
        mouseInput.position[0] - bounds.x,
        mouseInput.position[1] - bounds.y
    ];
    }
    {
    world.viewportCursor.position = [
        world.canvasCursor.position[0] / world.canvas.width * 2 -1,
        -1 *(world.canvasCursor.position[1] / world.canvas.height * 2 -1)
    ]
    }
    let point = [0,0,0]
    world.sceneCursor.ray = viewportToRay(world.viewportCursor.position, 1, world.camera.position, world.camera.viewMatrix,640  / 480,Math.PI /2)
    world.sceneCursor.hitManifold = rayToWorldPosition(world, world.sceneCursor.ray);
                
    if(world.sceneCursor.hitManifold.hit){
        point = world.sceneCursor.hitManifold.point;
        let scale = world.planet.scale;
        let position = world.planet.position;
        let inverseRotation = Matrix.fromQuarternion(Quarternion.inverse(world.planet.orientation))
        let inverseScale = Matrix.scale([1/scale[0], 1/scale[1], 1/scale[2]]);
        let inverseTranslation = Matrix.translation([-position[0], -position[1], -position[2]])
        let inverseModelMatrix = Matrix.multiply(inverseScale,inverseTranslation);
        inverseModelMatrix = Matrix.multiply(inverseRotation,inverseModelMatrix);
        point = Matrix.transform(inverseModelMatrix,point);
    
    }
    switch(world.interactionMode){
        case InteractionMode.Move:
            if(world.mouseInput.primaryMouseButton.state === MouseButtonState.Down && world.canvasCursor.overCanvas){
                world.planet.orientation = Quarternion.rotate(world.planet.orientation, AxisAngle.toQuarternion([0,1,0],elapsed * mouseInput.deltaPosition[0]))
                world.planet.orientation = Quarternion.rotate(world.planet.orientation, AxisAngle.toQuarternion([1,0,0],elapsed* mouseInput.deltaPosition[1]))
            }
            if(world.postCheckbox.checked){
                world.interactionMode = InteractionMode.Picker;
            }
            if(world.mouseInput.primaryMouseButton.state === MouseButtonState.Pressed && world.canvasCursor.overCanvas){
                world.domElements.xElement.value = point[0];
                world.domElements.yElement.value = point[1];
                world.domElements.zElement.value = point[2]; 

            }
            break;
        case InteractionMode.Picker:
            
            
            if(world.mouseInput.primaryMouseButton.state === MouseButtonState.Pressed && world.canvasCursor.overCanvas){
                if(point != [0,0,0]){
                   getThreads(world,point); 
                }       
            }
            if(!world.postCheckbox.checked){
                world.interactionMode = InteractionMode.Move;
            }
            break;
    }
    
    


    

   
    {
        let rotationMatrix =Matrix.fromQuarternion(world.planet.orientation);
        let scaleMatrix = Matrix.scale(world.planet.scale);
        let translationMatrix = Matrix.translation(world.planet.position);
        world.planet.modelMatrix = Matrix.multiply(translationMatrix,Matrix.multiply(scaleMatrix,rotationMatrix));
    }

    updateCameraMatrix(world.camera);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER,world.planet.model.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, world.planet.model.ebo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, world.planet.texture);    
    gl.vertexAttribPointer(
        world.programs.phong.vertexAttributes.vertex,
        3,
        gl.FLOAT,
        false,
        8 * 4,
        0
    );
    gl.enableVertexAttribArray(
        world.programs.phong.vertexAttributes.vertex
    );

    gl.vertexAttribPointer(
        world.programs.phong.vertexAttributes.vertexNormal,
        3,
        gl.FLOAT,
        false,
        8 * 4,
        3 * 4
    );
    gl.enableVertexAttribArray(
        world.programs.phong.vertexAttributes.vertexNormal
    );
    gl.vertexAttribPointer(
        world.programs.phong.vertexAttributes.uv,
        2,
        gl.FLOAT,
        false,
        8 * 4,
        6 * 4
    );
    gl.enableVertexAttribArray(
        world.programs.phong.vertexAttributes.uv
    );
    
    gl.useProgram(world.programs.phong.id);
    gl.uniformMatrix4fv(world.programs.phong.uniformAttributes.modelMatrix, false,world.planet.modelMatrix)
    gl.uniformMatrix4fv(world.programs.phong.uniformAttributes.projectionMatrix, false,world.camera.projectionMatrix);
    gl.uniformMatrix4fv(world.programs.phong.uniformAttributes.viewMatrix, false, world.camera.viewMatrix);
    gl.uniform1i(world.programs.phong.uniformAttributes.texture0,0);
    gl.drawElements(gl.TRIANGLES, world.planet.model.indicies.length, gl.UNSIGNED_SHORT, 0);

    ctx.fillStyle = "orange";

    let pin = world.pins.searchPin;
    ctx.fillRect(pin.rect.x, pin.rect.y, pin.rect.width, pin.rect.height);
    pin = world.pins.writePin;
    ctx.fillRect(pin.rect.x, pin.rect.y, pin.rect.width, pin.rect.height);

    updateMouseInput(world.mouseInput);
}


main();
