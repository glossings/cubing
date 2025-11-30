var currentRotation = "";
var cube = new RubiksCube();
var currentAlgorithm = "";//After an alg gets tested for the first time, it becomes the currentAlgorithm.
var currentScramble = "";
var algArr;//This is the array of alternatives to currentAlgorithm
var canvas = document.getElementById("cube");
var ctx = canvas.getContext("2d");
var stickerSize = canvas.width/5;
var currentAlgIndex = 0;
var algorithmHistory = [];
var historyIndex = -1;
var shouldRecalculateStatistics = true;
var cubeModes = ["flat", "3d", "virtual"];

createAlgsetPicker();
/*
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
}*/
Cube.initSolver();

document.getElementById("loader").style.display = "none";
var myVar = setTimeout(showPage, 1);
function showPage(){
    document.getElementById("page").style.display = "block";
}

var defaults = {"useVirtual":false,
                "showScramble":true,
                "realScrambles":true,
                "randAUF":true,
                "prescramble":true,
                "goInOrder":false,
                "mirrorAllAlgs":false,
                "mirrorAllAlgsAcrossS":false,
                "colourneutrality1":"",
                "colourneutrality2":"x2",
                "colourneutrality3":"y",
                "fullCN":false,
                "cubeType":"3x3",
                "algsetpicker":(document.getElementById("algsetpicker").options[0] || {}).value || "",
                "visualCubeView":"plan",
                "visualCubeMode":"flat",
                "randomizeSMirror":false,
                "randomizeMMirror":false,
                "autoCorrectRotation":true,
               };

for (var setting in defaults){ 
// If no previous setting exists, use default and update localStorage. Otherwise, set to previous setting
    if (typeof(defaults[setting]) === "boolean"){
        var elementBool = document.getElementById(setting);
        if (!elementBool){
            continue;
        }
        var previousSetting = localStorage.getItem(setting);
        if (previousSetting == null){
            elementBool.checked = defaults[setting];
            localStorage.setItem(setting, defaults[setting]);
        }
        else {
            elementBool.checked = previousSetting == "true"? true : false;
        }
    }
    else {
        var previousSetting = localStorage.getItem(setting);
        var element = document.getElementById(setting)
        if (element == null){
            continue;
        }
        if (previousSetting == null){
            element.value = defaults[setting];
            localStorage.setItem(setting, defaults[setting]);
        }
        else {
            element.value = previousSetting;
        }
    }
}

document.getElementById("lines").addEventListener("change", function(){
    drawCube(cube.cubestate);    
});

if (document.getElementById("useVirtual")){
    setVirtualCube(document.getElementById("useVirtual").checked);
}
createCheckboxes();
drawCube(cube.cubestate);
updateVisualCube("");
setCubeMode(localStorage.getItem("visualCubeMode") || "flat");

var algOverrides = {};
function ensureAlgOverrides(){
    try {
        var parsed = JSON.parse(localStorage.getItem("algOverrides"));
        if (parsed && typeof parsed === "object"){
            algOverrides = parsed;
        }
    } catch (error) {
        algOverrides = {};
    }
    if (!algOverrides){
        algOverrides = {};
    }
}
ensureAlgOverrides();

function normalizeAlgString(algStr){
    if (!algStr){ return ""; }
    var simplified = alg.cube.simplify(algStr).trim();
    return simplified.replace(/\s+/g, "");
}

function applyAlgOverride(algStr){
    var normalized = normalizeAlgString(algStr);
    return algOverrides[normalized] || algStr;
}

function saveAlgOverrides(baseAlgs, newAlgs){
    for (let i = 0; i < baseAlgs.length; i++){
        var base = normalizeAlgString(baseAlgs[i]);
        var replacement = newAlgs[i] ? normalizeAlgString(newAlgs[i]) : normalizeAlgString(baseAlgs[i]);
        if (base){
            algOverrides[base] = replacement;
        }
    }
    localStorage.setItem("algOverrides", JSON.stringify(algOverrides));
}

var useVirtual = document.getElementById("useVirtual");
if (useVirtual){
    useVirtual.addEventListener("click", function(){
        localStorage.setItem("useVirtual", this.checked);
        setCubeMode(this.checked ? "virtual" : (localStorage.getItem("visualCubeMode") || "flat"));
    });
}

var visualCubeContainer = document.getElementById("visual-cube-container");
if (visualCubeContainer){
    visualCubeContainer.addEventListener("click", function(){
        var currentMode = localStorage.getItem("visualCubeMode") || "flat";
        var nextMode = cubeModes[(cubeModes.indexOf(currentMode) + 1) % cubeModes.length];
        setCubeMode(nextMode);
    });
}


var showScramble = document.getElementById("showScramble");
if (showScramble){
    showScramble.addEventListener("click", function(){
        localStorage.setItem("showScramble", this.checked);
    });
}

var autoCorrectRotation = document.getElementById("autoCorrectRotation");
if (autoCorrectRotation){
    autoCorrectRotation.addEventListener("click", function(){
        localStorage.setItem("autoCorrectRotation", this.checked);
    });
}

var realScrambles = document.getElementById("realScrambles");
if (realScrambles){
    realScrambles.addEventListener("click", function(){
        localStorage.setItem("realScrambles", this.checked);
    });
}

var randAUF = document.getElementById("randAUF");
if (randAUF){
    randAUF.addEventListener("click", function(){
        localStorage.setItem("randAUF", this.checked);
    });
}

var prescramble = document.getElementById("prescramble");
if (prescramble){
    prescramble.addEventListener("click", function(){
        localStorage.setItem("prescramble", this.checked);
    });
}

var randomizeSMirror = document.getElementById("randomizeSMirror");
if (randomizeSMirror){
    randomizeSMirror.addEventListener("click", function(){
        localStorage.setItem("randomizeSMirror", this.checked);
    });
}

var randomizeMMirror = document.getElementById("randomizeMMirror");
if (randomizeMMirror){
    randomizeMMirror.addEventListener("click", function(){
        localStorage.setItem("randomizeMMirror", this.checked);
    });
}

var goInOrder = document.getElementById("goInOrder");
if (goInOrder){
    goInOrder.addEventListener("click", function(){
        localStorage.setItem("goInOrder", this.checked);
        currentAlgIndex=0;
    });
}

var checkAnswerButton = document.getElementById("checkAnswer");
if (checkAnswerButton){
    checkAnswerButton.addEventListener("click", checkTypedAnswer);
}
var answerInput = document.getElementById("answerInput");
if (answerInput){
    answerInput.addEventListener("keydown", function(event){
        if (event.key === "Enter"){
            event.preventDefault();
            checkTypedAnswer();
        }
    });
}
var saveAlgEditButton = document.getElementById("saveAlgEdit");
if (saveAlgEditButton){
    saveAlgEditButton.addEventListener("click", saveCurrentAlgEdit);
}
var openAlgEditor = document.getElementById("openAlgEditor");
if (openAlgEditor){
    openAlgEditor.addEventListener("click", function(){
        var panel = document.getElementById("algEditorPanel");
        if (panel){
            panel.style.display = "block";
        }
        var currentTest = algorithmHistory[algorithmHistory.length-1];
        if (currentTest){
            document.getElementById("algEditor").value = currentTest.appliedAlgs.join("\n");
        }
    });
}

var mirrorAllAlgs = document.getElementById("mirrorAllAlgs");
mirrorAllAlgs.addEventListener("click", function(){
    localStorage.setItem("mirrorAllAlgs", this.checked);
});

var mirrorAllAlgsAcrossS = document.getElementById("mirrorAllAlgsAcrossS");
mirrorAllAlgsAcrossS.addEventListener("click", function(){
    localStorage.setItem("mirrorAllAlgsAcrossS", this.checked);
});

var fullCN = document.getElementById("fullCN");
fullCN.addEventListener("click", function(){
    localStorage.setItem("fullCN", this.checked);
});

var cubeType = document.getElementById("cubeType");
cubeType.addEventListener("change", function(){
    localStorage.setItem("cubeType", this.value);
    drawCube(cube.cubestate);
    updateVisualCube("");
});

var algsetpicker = document.getElementById("algsetpicker");
algsetpicker.addEventListener("change", function(){
    createCheckboxes();
	shouldRecalculateStatistics = true;
    localStorage.setItem("algsetpicker", this.value);
});

try{ // only for mobile
    const leftPopUpButton = document.getElementById("left_popup_button");
    const rightPopUpButton = document.getElementById("right_popup_button");
    leftPopUpButton.addEventListener("click", function(){

        const leftPopUp = document.getElementById("left_popup");
        const rightPopUp = document.getElementById("right_popup");
        if (leftPopUp.style.display == "block"){
            leftPopUp.style.display = "none";
        }
        else {
            leftPopUp.style.display = "block";
            rightPopUp.style.display = "none";
        }
    });

    rightPopUpButton.addEventListener("click", function(){

        const leftPopUp = document.getElementById("left_popup");
        const rightPopUp = document.getElementById("right_popup");
        if (rightPopUp.style.display == "block"){
            rightPopUp.style.display = "none";
        }
        else {
            rightPopUp.style.display = "block";
            leftPopUp.style.display = "none";
        }
    });
} catch (error) {

}
function fillSticker(x, y, colour) {
    ctx.fillStyle = colour;
    ctx.fillRect(stickerSize * x, stickerSize * y, stickerSize, stickerSize);
}

function fillWithIndex(x, y, face, index, cubeArray, shouldBeCleared = false) {
    index--;
    switch (face) {
        case "u":
            break;
        case "r":
            index += 9;
            break;
        case "f":
            index += 18;
            break;
        case "d":
            index += 27;
            break;
        case "l":
            index += 36;
            break;
        case "b":
            index += 45;
            break;
    }

    var sticker = cubeArray[index];
    var colourMap = ["", "white", "red", "green", "yellow", "orange", "blue"];
    var colour = colourMap[sticker] || "black";
    if(shouldBeCleared){
        colour = "black";
    }
    fillSticker(x, y, colour);
}
function drawCube(cubeArray) {
    //Just Draw Corners when Doing 2x2
    //TODO: Is this a good Idea? Is there a 2x2 draw thing already available for
    //RubiksCube.js?
    if(document.getElementById("cubeType").value == "2x2"){

        //Clear not used Elements
        fillWithIndex(0, 0, "l", 1, cubeArray,true);
        fillWithIndex(1, 0, "u", 1, cubeArray,true);
        fillWithIndex(2, 0, "u", 2, cubeArray,true);
        fillWithIndex(3, 0, "u", 3, cubeArray,true);
        fillWithIndex(4, 0, "r", 3, cubeArray,true);

        fillWithIndex(0, 1, "l", 2, cubeArray,true);
        fillWithIndex(1, 1, "u", 4, cubeArray,true);
        fillWithIndex(2, 1, "u", 5, cubeArray,true);
        fillWithIndex(3, 1, "u", 6, cubeArray,true);
        fillWithIndex(4, 1, "r", 2, cubeArray,true);

        fillWithIndex(0, 2, "l", 3, cubeArray,true);
        fillWithIndex(1, 2, "u", 7, cubeArray,true);
        fillWithIndex(2, 2, "u", 8, cubeArray,true);
        fillWithIndex(3, 2, "u", 9, cubeArray,true);
        fillWithIndex(4, 2, "r", 1, cubeArray,true);

        fillWithIndex(0, 3, "l", 3, cubeArray,true);
        fillWithIndex(1, 3, "f", 1, cubeArray,true);
        fillWithIndex(2, 3, "f", 2, cubeArray,true);
        fillWithIndex(3, 3, "f", 3, cubeArray,true);
        fillWithIndex(4, 3, "r", 1, cubeArray,true);

        fillWithIndex(0, 4, "l", 6, cubeArray,true);
        fillWithIndex(1, 4, "f", 4, cubeArray,true);
        fillWithIndex(2, 4, "f", 5, cubeArray,true);
        fillWithIndex(3, 4, "f", 6, cubeArray,true);
        fillWithIndex(4, 4, "r", 4, cubeArray,true);

        fillWithIndex(0, 5, "l", 9, cubeArray,true);
        fillWithIndex(1, 5, "f", 7, cubeArray,true);
        fillWithIndex(2, 5, "f", 8, cubeArray,true);
        fillWithIndex(3, 5, "f", 9, cubeArray,true);
        fillWithIndex(4, 5, "r", 7, cubeArray,true);

        //Draw 2x2
        fillWithIndex(0, 2, "l", 1, cubeArray);
        fillWithIndex(1, 2, "u", 1, cubeArray);
        fillWithIndex(2, 2, "u", 3, cubeArray);
        fillWithIndex(3, 2, "r", 3, cubeArray);

        fillWithIndex(0, 3, "l", 3, cubeArray);
        fillWithIndex(1, 3, "u", 7, cubeArray);
        fillWithIndex(2, 3, "u", 9, cubeArray);
        fillWithIndex(3, 3, "r", 1, cubeArray);

        fillWithIndex(0, 4, "l", 3, cubeArray);
        fillWithIndex(1, 4, "f", 1, cubeArray);
        fillWithIndex(2, 4, "f", 3, cubeArray);
        fillWithIndex(3, 4, "r", 1, cubeArray);

        fillWithIndex(0, 5, "l", 9, cubeArray);
        fillWithIndex(1, 5, "f", 7, cubeArray);
        fillWithIndex(2, 5, "f", 9, cubeArray);
        fillWithIndex(3, 5, "r", 7, cubeArray);

    }else{
        fillWithIndex(0, 0, "l", 1, cubeArray);
        fillWithIndex(1, 0, "u", 1, cubeArray);
        fillWithIndex(2, 0, "u", 2, cubeArray);
        fillWithIndex(3, 0, "u", 3, cubeArray);
        fillWithIndex(4, 0, "r", 3, cubeArray);

        fillWithIndex(0, 1, "l", 2, cubeArray);
        fillWithIndex(1, 1, "u", 4, cubeArray);
        fillWithIndex(2, 1, "u", 5, cubeArray);
        fillWithIndex(3, 1, "u", 6, cubeArray);
        fillWithIndex(4, 1, "r", 2, cubeArray);

        fillWithIndex(0, 2, "l", 3, cubeArray);
        fillWithIndex(1, 2, "u", 7, cubeArray);
        fillWithIndex(2, 2, "u", 8, cubeArray);
        fillWithIndex(3, 2, "u", 9, cubeArray);
        fillWithIndex(4, 2, "r", 1, cubeArray);

        fillWithIndex(0, 3, "l", 3, cubeArray);
        fillWithIndex(1, 3, "f", 1, cubeArray);
        fillWithIndex(2, 3, "f", 2, cubeArray);
        fillWithIndex(3, 3, "f", 3, cubeArray);
        fillWithIndex(4, 3, "r", 1, cubeArray);

        fillWithIndex(0, 4, "l", 6, cubeArray);
        fillWithIndex(1, 4, "f", 4, cubeArray);
        fillWithIndex(2, 4, "f", 5, cubeArray);
        fillWithIndex(3, 4, "f", 6, cubeArray);
        fillWithIndex(4, 4, "r", 4, cubeArray);

        fillWithIndex(0, 5, "l", 9, cubeArray);
        fillWithIndex(1, 5, "f", 7, cubeArray);
        fillWithIndex(2, 5, "f", 8, cubeArray);
        fillWithIndex(3, 5, "f", 9, cubeArray);
        fillWithIndex(4, 5, "r", 7, cubeArray);

        let lineValue = document.getElementById("lines").value;
        if (lineValue === "none") return;
        // Draw outlines
        if (lineValue === "thin-gray") {
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = "#ccc";
        } else if (lineValue === "thick-gray") {
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#ccc";
        } else if (lineValue === "thin-black") {
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = "#000";
        } else if (lineValue === "thick-black") {
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#000";
        }
        ctx.strokeRect(-1, -1, 1 + stickerSize * 2, 1 + stickerSize);
        ctx.strokeRect(-1, stickerSize * 2, 1 + stickerSize * 2, stickerSize * 2);
        ctx.strokeRect(-1, stickerSize * 5, 1 + stickerSize * 2, 1 + stickerSize);

        ctx.strokeRect(stickerSize * 2, stickerSize, stickerSize, stickerSize);
        ctx.strokeRect(stickerSize * 2, stickerSize * 4, stickerSize, stickerSize);

        ctx.strokeRect(stickerSize * 3, -1, stickerSize * 2 + 1, 1 + stickerSize);
        ctx.strokeRect(stickerSize * 3, stickerSize * 2, stickerSize * 2 + 1, stickerSize * 2);
        ctx.strokeRect(stickerSize * 3, stickerSize * 5, stickerSize * 2 + 1, 1 + stickerSize);
    }
}


function doAlg(algorithm){
    cube.doAlgorithm(algorithm);
    drawCube(cube.cubestate);
}


function getRandAuf(letter){
    var rand = Math.floor(Math.random()*4);//pick 0,1,2 or 3
    var aufs = [letter + " ", letter +"' ",letter + "2 ", ""];
    return aufs[rand];
}

// Returns a random sequence of quarter turns of the specified length. Quarter turns are used to break OLL. Two consecutive moves may not be on the same axis.
function getPremoves(length) {
    var previous = "U"; // prevents first move from being U or D
    var moveset = ['U', 'R', 'F', 'D', 'L', 'B'];
    var amts = [" ","' "];
    var randmove = "";
    var sequence = "";
    for (let i=0; i<length; i++) {
        do {
            randmove = moveset[Math.floor(Math.random()*moveset.length)];
        } while (previous != "" && (randmove === previous || Math.abs(moveset.indexOf(randmove) - moveset.indexOf(previous)) === 3))
        previous = randmove;
        sequence += randmove;
        sequence += amts[Math.floor(Math.random()*amts.length)];
    }
    return sequence;
}

function getPostmoves(length) {
    var previous = "";
    var moveset = ['U', 'R', 'F', 'D', 'L', 'B'];
    var amts = [" ","' ", "2 "];
    var randmove = "";
    var sequence = "";
    for (let i=0; i<length; i++) {
        do {
            randmove = moveset[Math.floor(Math.random()*moveset.length)];
        } while (previous != "" && (randmove === previous || Math.abs(moveset.indexOf(randmove) - moveset.indexOf(previous)) === 3))
        previous = randmove;
        sequence += randmove;
        sequence += amts[Math.floor(Math.random()*amts.length)];
    }
    return sequence;
}


function obfuscate(algorithm, numPremoves=3, minLength=16, numPostmoves=0){

    /*

    Henceforth let A = B, where A and B are algs, mean that A and B are exactly equivalent,
    both in moves and in effect. 
    
    Let A ~ B mean that alg A and alg B have the same effect on a cube, but A=B evaluates to false

    i.e. if A = F R U' R' U2 F' r' F L and B = F2 
    Then A ~ B is a true statement. However A = B is False (both algs have the same effect but are written differently)

    Let sol(alg)~alg' be a function which returns the solution to a cube scrambled by alg
    and ob(alg)~alg to be a function which returns a series of moves that has the same effect as alg

    sol and ob are evaluated by using a cube solver - so we want to avoid evaluating them more than necessary. Evaluating alg' is 
    cheap, despite the fact that alg' ~ sol(alg)

    This function first generates a series of premoves and a random series of postmoves, which are both free from rotations.

    The goal of this function is to generate an algorithm obAlg such that

    obAlg ~ alg
    and 
    obAlg = premoves + moves + postmoves

    cube.js provides us with a sol function. However it only works for algorithms that return the cube to their original 
    orientation. Let orient(alg) be be such that alg + orient(alg), is an alg which ends in its original orientation, and 
    orient(alg) consists of only rotations

    We can construct obAlg as follows:
    
    alg ~ premoves + ob(premoves' + alg + postmoves') + postmoves
    alg ~ premoves + sol(postmoves + alg' + premoves) + postmoves
    Let o = orient(postmoves + alg' + premoves)
    
    alg ~ premoves + sol(postmoves + alg' + premoves + o + o') + postmoves
    alg ~ premoves + o + sol(postmoves + alg' + premoves + o) + postmoves

    Having rotations in the middle is ugly, so we use the moveRotationsToStart function
    to move them to the start using some alg manipulation

    Note that all rotations will be at the start as long premoves and postmoves consist of outer layer turns only

    */



    var premoves = getPremoves(numPremoves);
    var postmoves = getPostmoves(numPostmoves);

    rc = new RubiksCube()
    rc.doAlgorithm(postmoves + alg.cube.invert(algorithm) + premoves)
    var o = rc.wcaOrient() 
    solution = rc.solution()
    

    var obAlg = moveRotationsToStart(premoves, o) + solution  + postmoves;
    var obAlg = alg.cube.simplify(obAlg).replace(/2'/g, "2");
    return obAlg.split(" ").length >= minLength ? obAlg : obfuscate(algorithm, numPremoves+1, minLength, numPostmoves);

}


function parseMove(move){
    if (move.trim() == ""){
        return [null, null]
    }

    var myRegexp = /([RUFBLDrufbldxyzEMS])(\d*)('?)/g;
    var match = myRegexp.exec(move.trim());

    if (match!=null) {

        var side = match[1];

        var times = 1;
        if (!match[2]=="") {
            times = match[2] % 4;
        }

        if (match[3]=="'") {
            times = (4 - times) % 4;
        }

        return [side, times]
    }
    else {
        return [null, null];
    }

}
function moveRotationsToStart(rotationFreeAlg, rotations){
    // Needs moves of algs to be separated by spaces
    // wide moves not supported

    transformDict = {
        "U": "U",
        "R": "R",
        "F": "F",
        "B": "B",
        "L": "L",
        "D": "D"
    }

    rotationEffectDict = {
        "x": {"U":"B", "B":"D", "D":"F", "F":"U"},
        "y": {"F":"L", "L":"B", "B":"R", "R":"F"},
        "z": {"U":"R", "R":"D", "D":"L", "L":"U"}
    }

    rotationsArr = rotations.trim().split(" ");
    movesArr = rotationFreeAlg.trim().split(" ")

    rotationsArr.forEach(rotation => {
        let [side, times] = parseMove(rotation)

        if (side !== null){

            for (let i = 0; i<times; i++){
                for (const [key1, value1] of Object.entries(transformDict)) {
                    transformDict[key1] = rotationEffectDict[side][value1] || transformDict[key1]
                }
            }
        }

    })

    newMovesArr = []
    movesArr.forEach(move => {
        let [side, times] = parseMove(move)
        if (side !== null) {
            newMovesArr.push(move.replace(side, transformDict[side]));
        }
    })

    return rotations + " " + newMovesArr.join(" ");

}


function equivalentAlgs(alg1, alg2) {
    const rc1 = new RubiksCube();
    const rc2 = new RubiksCube();
    rc1.doAlgorithm(alg1);
    rc2.doAlgorithm(alg2);

    return rc1.cubestate.length === rc2.cubestate.length && 
           rc1.cubestate.every((value, index) => value === rc2.cubestate[index]);
}


function makeMove(side, times) {
  let timesMod4 = times % 4
  switch (timesMod4) {
    case 1:
      return side;
    case 2:
      return side + "2";
    case 3:
      return side + "'";
    case 0:
      return "";
    default:
      return ""
  }
  return ""
}



function cancelSingleAxis(originalAlg, axisMoves) {


  moveCounter = {}
  for (let move of axisMoves) {
    moveCounter[move] = 0;
  }

  moves = originalAlg.split(" ")

  newAlg = ""

  let counting = false

  for (let i = 0; i<moves.length; i++) {
  	
  	move = moves[i];
    let [side, times] = parseMove(move);

    let isLastLoop = i == moves.length - 1

    if (isLastLoop){
        // On the last loop, ongoing counts must be finished
        if (counting){

            if (axisMoves.includes(side)){
                moveCounter[side] += times

                for (let key in moveCounter) {
                    let newMove = makeMove(key, moveCounter[key])
                    newAlg += newMove + " "// (newMove == "" ? "" : " ")
                }
            }
            else {

                for (let key in moveCounter) {
                    let newMove = makeMove(key, moveCounter[key])
                    newAlg += newMove + " "// (newMove == "" ? "" : " ")
                }
                newAlg += move + " "//+ (move == "" ? "" : " ");
            }

        }
        else {
            newAlg += move + " "//+ (move == "" ? "" : " ");
        }
        break

    }

    if (!counting && axisMoves.includes(side)) {
      counting = true;
      for (let key of axisMoves) {
        moveCounter[key] = 0;
      }
      moveCounter[side] += times
    } else if (counting && axisMoves.includes(side)) {
      moveCounter[side] += times
    } else if (counting && !axisMoves.includes(side)) {
      counting = false;
      for (let key in moveCounter) {
        let newMove = makeMove(key, moveCounter[key])
        newAlg += newMove + " "// (newMove == "" ? "" : " ")
      }
      newAlg += move + " "
    } else {
      newAlg += move + " "//+ (move == "" ? "" : " ");
    }
  }

  return newAlg

}

function cancelParallelMoves(originalAlg) {
  /* Tested on algs which consist of outer moves and rotations only
    TODO: implement wide moves by replacing r with L x, etc
  */
  
  let cancelledAlg = cancelSingleAxis(originalAlg, ["U", "D", "y"])
  cancelledAlg = cancelSingleAxis(cancelledAlg, ["R", "L", "x"])
  cancelledAlg = cancelSingleAxis(cancelledAlg, ["F", "B", "z"])
  cancelledAlg = cancelledAlg.replace(/\s+/g, ' ').trim();

  return cancelledAlg
  
}


function addAUFs(algArr){

    var rand1 = getRandAuf("U");
    var rand2 = getRandAuf("U");
    //algorithm = getRandAuf() + algorithm + " " +  getRandAuf()
    var i = 0;
    for (;i<algArr.length;i++){
        algArr[i] = alg.cube.simplify(rand1 + algArr[i] + " " + rand2); 
    }
    return algArr;
}

function generateAlgScramble(raw_alg,set,obfuscateAlg,shouldPrescramble){
    
    if (set == "F3L"){
        return Cube.random().solve();
    }
    if (!obfuscateAlg){
        return alg.cube.invert(raw_alg);
    } else if (!shouldPrescramble){//if realscrambles not checked but should not prescramble, just obfuscate the inverse
        return obfuscate(alg.cube.invert(raw_alg));
    }

    switch(set){
        case "ZBLS (Chad Batten, Tao Yu)":
        case "VHLS (Chad Batten)":
        case "ZBLSE (John McWilliams)":
            return generatePreScramble(raw_alg, "RBR'FRB'R'F',RUR'URU2R',U,R'U'RU'R'U2R,F2U'R'LF2L'RU'F2", 1000, true);//ZBLLscramble

        case "OLL":
        case "OLL (Feliks Zemdegs - Cubeskills)":
        case "VLS":
        case "WVLS":
        case "OH OLL":
        case "CLS (Justin Taylor)":
        case "VLS (Jayden McNeill)":
		case "ZZ OLS (Egide Hirwa)":
            return generatePreScramble(raw_alg, "R'FR'B2'RF'R'B2'R2,F2U'R'LF2RL'U'F2,U", 100, true);//PLL scramble

        case "ELS (FR) (Justin Taylor)":
            return generatePreScramble(raw_alg, "R'FR'B2'RF'R'B2'R2,F2U'R'LF2RL'U'F2,U,R' D' R U R' D R,R F' L F R' F' L' F,R2 U R2' U R2 U2' R2',R U' R' U R U2' R' U R U' R'", 100, true);//CLS FR scramble
        case "ELS (BR) (Justin Taylor)":
            return generatePreScramble(raw_alg, "R'FR'B2'RF'R'B2'R2,F2U'R'LF2RL'U'F2,U,R2' U' R2 U' R2 U2' R2,R' U2 R U' R' U' R,R' U R U2' R' U R,R' U R U' R' U2' R U' R' U R", 100, true);//CLS FR scramble

        case "OLLCP":
        case "OLLCP (Cale Schoon)":
        case "OLLCP (Justin Taylor, WIP)":
        case "COLL":
        case "COLL (Tao Yu)":
        case "CP solved OLLCP":
        case "Briggs-Taylor Reduction COLL":
            return generatePreScramble(raw_alg, "F2U'R'LF2RL'U'F2,U", 5000, true);//EPLL scramble

        case "CMLL":
        case "OH CMLL":
            return generatePreScramble(raw_alg, "M2,MUM,MUM',MU'M,MU'M',MU2M,MU2M',M'UM,M'UM',M'U'M,M'U'M',M'U2M,M'U2M'", 100, true);//LSE scramble

        case "3x3 CLL (Justin Taylor)":
            return generatePreScramble(raw_alg, "F2 U' R' L F2 L' R U' F2, R' U2' R2 U R' U' R' U2' r U R U' r', U", 100, true);//ELL scramble

        case "42 (Shadowslice)":
            return generatePreScramble(raw_alg, "M'UM, M'U'M, MUM', MU'M',M2, RUMU'R'M", 500, true);//L7E scramble

        case "OL5C (SqAree)":
            return generatePreScramble(raw_alg, "R2,U,D", 100, true);//<U, D, R2> scramble

        case "TOLS (Justin Taylor)":
        case "TSLE":
            return generatePreScramble(raw_alg, "R2 U2' R2' U' R2 U' R2,R'FR'B2'RF'R'B2'R2,F2U'R'LF2RL'U'F2,U", 100, true); //TTLL scramble

        case "F2L":
            return generatePreScramble(raw_alg, "FRUR'U'F',RBR'FRB'R'F',RUR'URU2R',U", 100, true);

        case "Ortega OLL":
            return generatePreScramble(raw_alg, "R F' R B2 R' F R B2 R2,R'FR'B2'RF'R'B2'R2,U,D", 100, true);
        case "CPLS (Arc)":
        case "CPEOLL":
            return generatePreScramble(raw_alg, "R U R' U R U2' R', U, L' U' L U' L' U2 L", 100, true);//2GLL scramble

        case "Pseudo2GLL (no algs)":
            return generatePreScramble(raw_alg, "R U R' U R U2' R', U, L' U' L U' L' U2 L, F R' F' M F R F' M'", 10000, true);
        case "Ribbon Multislotting":
            return generatePreScramble(raw_alg, "R2 U2' R2' U' R2 U' R2,R'FR'B2'RF'R'B2'R2,F2U'R'LF2RL'U'F2,U,R U' R' U2 R U' R' ,R U2' R' U R U R' ,R U R' U R U2' R' ,R U2 R' U' R U' R' ", 10000, true);
        case "TDR (Trangium, Yash Mehta)":
            return generatePreScramble(raw_alg, "RBR'FRB'R'F',RUR'URU2R',U,R'U'RU'R'U2R,F2U'R'LF2L'RU'F2", 1000, true, getRandAuf("D")); // ZBLL-ABF scramble
        case "Domino Reduction":
            let scrambleLength = 150 
            let generator = ["E", "E'", "U D", "U D'", "M2", "S2", "U2 D", "D U2", "U", "U2", "U'", "R2", "L2", "B2", "F2", "D", "D2", "D'"];
            let drScramble = Array.from({length: scrambleLength}, () => generator[Math.floor(Math.random() * generator.length)]).join(" ");
            let rc = new RubiksCube();
            rc.doAlgorithm(drScramble);
            return obfuscate(drScramble + rc.wcaOrient() + alg.cube.invert(raw_alg), numPremoves=3, minLength=13, numPostmoves=5);
        default:  

            let inverse = alg.cube.invert(raw_alg);
            return obfuscate(inverse);
    }

}



function generatePreScramble(raw_alg, generator, times, obfuscateAlg, premoves=""){

    var genArray = generator.split(",");

    var scramble = premoves;
    var i = 0;

    for (; i<times; i++){
        var rand = Math.floor(Math.random()*genArray.length);
        scramble += genArray[rand];
    }
    scramble += alg.cube.invert(raw_alg);

    if (obfuscateAlg){
        
        return obfuscate(scramble);
    }
    else {
        return scramble;
    }

}
function generateOrientation(){


    var cn1 = document.getElementById("colourneutrality1").value;
    if (document.getElementById("fullCN").checked){
        var firstRotation = ["", "x", "x'", "x2", "y", "y'"]
        // each one of these first rotations puts a differnt color face on F
        var secondRotation = ["", "z", "z'", "z2"]
        // each second rotation puts a different edge on UF
        // each unique combination of a first and second rotation 
        // must result in a unique orientation because a different color is on F
        // and a different edge is on UF. Hence all 6x4=24 rotations are reached.

        var rand1 = Math.floor(Math.random()*6);
        var rand2 = Math.floor(Math.random()*4);
        var randomPart = firstRotation[rand1] + secondRotation[rand2];
        if (randomPart == "x2z2"){
            randomPart = "y2";
        }
        var fullOrientation = cn1 + randomPart; // Preorientation to perform starting from white top green front
        return [fullOrientation, randomPart];
    }
    var cn2 = document.getElementById("colourneutrality2").value;
    var cn3 = document.getElementById("colourneutrality3").value;

    //todo: warn if user enters invalid strings

    localStorage.setItem("colourneutrality1", cn1);
    localStorage.setItem("colourneutrality2", cn2);
    localStorage.setItem("colourneutrality3", cn3);

    var rand1 = Math.floor(Math.random()*4);
    var rand2 = Math.floor(Math.random()*4);

    //console.log(cn1 + cn2.repeat(rand1) + cn3.repeat(rand2));
    var randomPart = cn2.repeat(rand1) + cn3.repeat(rand2); // Random part of the orientation
    var fullOrientation = cn1 + randomPart; // Preorientation to perform starting from white top green front
    return [fullOrientation, randomPart];
}

class AlgTest {
    constructor(baseAlgs, appliedAlgs, scramble, solutions, preorientation, set, visualCubeView, cubeType, orientRandPart) {
        this.baseAlgs = baseAlgs;
        this.appliedAlgs = appliedAlgs;
        this.scramble = scramble;
        this.solutions = solutions;
        this.preorientation = preorientation;
        this.set = set;
        this.visualCubeView = visualCubeView;
        this.cubeType = cubeType;
        this.orientRandPart = orientRandPart;
    }

    getHtmlFormattedScramble() {
        let cancelled = alg.cube.simplify(this.orientRandPart + this.scramble);
        cancelled = cancelParallelMoves(cancelled);
        let parts = cancelled.split(" ")
        let htmlStr = ""
        let stopColoring = false // only want to color the rotations at the start of the alg
        for (let part of parts){
            if (part.includes("x") || part.includes("y") || part.includes("z")){
                if (!stopColoring){
                    htmlStr = htmlStr + `<span style=\"color: #90f182\">${part}</span> `
                }
                
            }
            else {
                htmlStr = htmlStr + part + " "
                stopColoring = true;
            }
        }
        return htmlStr.trim().replace(/2'/g, "2");

    }
}

// Adds extra rotations to the end of an alg to reorient
function correctRotation(alg) {
    var rc = new RubiksCube();
    rc.doAlgorithm(alg);
    var ori = rc.wcaOrient();
	
    return alg + " " + ori;
}

function generateAlgTest(){

    var set = document.getElementById("algsetpicker").value;
    var obfuscateAlg = document.getElementById("realScrambles").checked;
    var shouldPrescramble = document.getElementById("prescramble").checked;
    var randAUF = document.getElementById("randAUF").checked;

    let neverAUF = ["Domino Reduction"];

    if (neverAUF.includes(set)){
        randAUF = false;
    }

    var algList = createAlgList()
    if (shouldRecalculateStatistics){
        updateAlgsetStatistics(algList);
        shouldRecalculateStatistics = false;
    }
    var rawAlgStr = randomFromList(algList);
    var baseAlgs = fixAlgorithms(rawAlgStr.split("/"));
    var appliedAlgs = baseAlgs.map(a => applyAlgOverride(a));

    //Do non-randomized mirroring first. This allows a user to practise left slots, back slots, front slots, rights slots
    // etc for F2L like algsets
    if (mirrorAllAlgs.checked && !randomizeMMirror.checked) {
        appliedAlgs = mirrorAlgsAcrossAxis(appliedAlgs, axis="M");
    }
    if (mirrorAllAlgsAcrossS.checked && !randomizeSMirror.checked) {
        appliedAlgs = mirrorAlgsAcrossAxis(appliedAlgs, axis="S");
    }
    if (mirrorAllAlgs.checked && randomizeMMirror.checked) {
        if (Math.random() > 0.5){
            appliedAlgs = mirrorAlgsAcrossAxis(appliedAlgs, axis="M");
        }
    }
    if (mirrorAllAlgsAcrossS.checked && randomizeSMirror.checked) {
        if (Math.random() > 0.5){
            appliedAlgs = mirrorAlgsAcrossAxis(appliedAlgs, axis="S");
        }
    }


    var solutions;
    if (randAUF){
        solutions = addAUFs(appliedAlgs.slice());
    } else {
        solutions = appliedAlgs.slice();
    }



    var scramble = generateAlgScramble(localStorage.getItem("autoCorrectRotation")=="true"?correctRotation(solutions[0]):solutions[0],set,obfuscateAlg,shouldPrescramble);
    if (set == "F3L"){
        solutions = [alg.cube.invert(scramble).replace(/2'/g, "2")];
    }
    var [preorientation, orientRandPart] = generateOrientation();
    orientRandPart = alg.cube.simplify(orientRandPart);

    var cubeType = document.getElementById("cubeType").value;
    var visualCubeView = "plan";

    var algTest = new AlgTest(baseAlgs, appliedAlgs, scramble, solutions, preorientation, set, visualCubeView, cubeType, orientRandPart);
    return algTest;
}
function testAlg(algTest, addToHistory=true){

    var scramble = document.getElementById("scramble");

    if (document.getElementById("showScramble").checked){
        scramble.innerHTML = algTest.getHtmlFormattedScramble()//"<span style=\"color: #90f182\">" + algTest.orientRandPart + "</span>" + " " + algTest.scramble;
    } else{
        scramble.innerHTML = "&nbsp;";
    }

    document.getElementById("algdisp").innerHTML = "";

    cube.resetCube();
    doAlg(algTest.preorientation);
    doAlg(algTest.scramble);
    drawCube(cube.cubestate)

    updateVisualCube(algTest.preorientation + algTest.scramble);

    if (addToHistory){
        algorithmHistory.push(algTest);
    }
    console.log(algTest);

}

function updateAlgsetStatistics(algList){
    if (document.getElementById("algsetpicker").value == "F3L"){
        var stats = {"Number of algs": "43,252,003,274,489,856,000"};
    }
    else {
        var stats = {"STM": averageMovecount(algList, "btm", false).toFixed(3),
                 "SQTM": averageMovecount(algList, "bqtm", false).toFixed(3),
                 "STM (including AUF)": averageMovecount(algList, "btm", true).toFixed(3),
                 "SQTM (including AUF)": averageMovecount(algList, "bqtm", true).toFixed(3),
                 "Number of algs": algList.length};
    }
    var table = document.getElementById("algsetStatistics");
    table.innerHTML = "";
    var th = document.createElement("th");
    th.appendChild(document.createTextNode("Algset Statistics"));
    table.appendChild(th);
    for (var key in stats){
        var tr = document.createElement("tr");
        var description = document.createElement("td");
        var value = document.createElement("td");
        description.appendChild(document.createTextNode(key));
        value.appendChild(document.createTextNode(stats[key]));
        tr.appendChild(description);
        tr.appendChild(value);
        table.appendChild(tr);
    }

}

function reTestAlg(){

    var lastTest = algorithmHistory[algorithmHistory.length-1];
    if (lastTest==undefined){
        return;
    }
    cube.resetCube();
    doAlg(lastTest.preorientation);
    doAlg(lastTest.scramble);
    drawCube(cube.cubestate);

}

function updateTrainer(scramble, solutions, algorithm){
    if (scramble!=null){
        document.getElementById("scramble").innerHTML = scramble;
    }
    if (solutions!=null){
        document.getElementById("algdisp").innerHTML = solutions;
    }

    if (algorithm!=null){
        cube.resetCube();
        doAlg(algorithm);
        updateVisualCube(algorithm);
    }
}
function fixAlgorithms(algorithms){
    //for now this just removes brackets
    var i = 0;
    for (;i<algorithms.length;i++){
        algorithms[i] = alg.cube.simplify(algorithms[i].replace(/\[|\]|\)|\(/g, ""));
    }
    return algorithms;
    //TODO Allow commutators

}

function updateVisualCube(algorithm){

    switch (document.getElementById("cubeType").value){
        case "2x2":
            var pzl = "2";
            break;
        case "3x3":
            var pzl = "3";
            break;
    }

    var mode = localStorage.getItem("visualCubeMode") || "flat";
    if (mode === "virtual"){
        return;
    }

    var view = mode === "flat" ? "plan" : "";

    var imgsrc = "https://www.cubing.net/api/visualcube/?fmt=svg&size=320&view=" + view + "&bg=black&pzl=" + pzl + "&alg=x2" + algorithm;

    var imgEl = document.getElementById("visualcube");
    if (imgEl){
        imgEl.src = imgsrc;
    }
}

function displayAlgorithm(algTest, reTest=true){    

    //If reTest is true, the scramble will also be setup on the virtual cube
    if (reTest){
        reTestAlg();
    }

    updateTrainer(algTest.scramble, algTest.solutions.join("<br><br>"), null);

    scramble.style.color = '#e6e6e6';
}

function displayAlgorithmFromHistory(index){    

    var algTest = algorithmHistory[index];

    console.log( algTest );

    updateTrainer(algTest.getHtmlFormattedScramble(), algTest.solutions.join("<br><br>"), algTest.preorientation+algTest.scramble);
    resetAnswerUI(algTest);
    scramble.style.color = '#e6e6e6';
}

function displayAlgorithmForPreviousTest(reTest=true){//not a great name

    var lastTest = algorithmHistory[algorithmHistory.length-1];
    if (lastTest==undefined){
        return;
    }
    //If reTest is true, the scramble will also be setup on the virtual cube
    if (reTest){
        reTestAlg();
    }

    //updateTrainer("<span style=\"color: #90f182\">" + lastTest.orientRandPart + "</span>" + " "+ lastTest.scramble, lastTest.solutions.join("<br><br>"), null, null);
    updateTrainer(lastTest.getHtmlFormattedScramble(), lastTest.solutions.join("<br><br>"), null);
    resetAnswerUI(lastTest);
    scramble.style.color = '#e6e6e6';
}

function checkTypedAnswer(){
    var answerInput = document.getElementById("answerInput");
    var feedback = document.getElementById("answerFeedback");
    if (!answerInput || !feedback || algorithmHistory.length === 0){
        return;
    }

    var attempt = answerInput.value.trim();
    if (attempt === ""){
        feedback.innerHTML = "Type an algorithm first.";
        feedback.style.color = "#f5a623";
        return;
    }

    var normalizedAttempt;
    try {
        normalizedAttempt = normalizeAlgString(attempt);
    } catch (error) {
        feedback.innerHTML = "That doesn't look like a valid alg.";
        feedback.style.color = "#ff7b7b";
        return;
    }

    var idx = historyIndex >= 0 ? historyIndex : algorithmHistory.length - 1;
    var currentTest = algorithmHistory[idx];
    var normalizedSolutions = currentTest.solutions.map((sol) => normalizeAlgString(sol));

    if (normalizedSolutions.includes(normalizedAttempt)){
        feedback.innerHTML = "Correct!";
        feedback.style.color = "#90f182";
    } else {
        feedback.innerHTML = "Not quite. Solution: " + currentTest.solutions.join(" / ");
        feedback.style.color = "#ff7b7b";
    }
}

function saveCurrentAlgEdit(){
    var algEditor = document.getElementById("algEditor");
    var feedback = document.getElementById("answerFeedback");
    if (!algEditor || algorithmHistory.length === 0){
        return;
    }
    var idx = historyIndex >= 0 ? historyIndex : algorithmHistory.length - 1;
    var currentTest = algorithmHistory[idx];
    var editedLines = algEditor.value.split("\n").map(line => line.trim()).filter(line => line.length>0);
    if (editedLines.length === 0){
        editedLines = currentTest.baseAlgs.slice();
    }

    try {
        saveAlgOverrides(currentTest.baseAlgs, editedLines);
        currentTest.appliedAlgs = editedLines.slice();
        if (document.getElementById("randAUF").checked){
            currentTest.solutions = addAUFs(editedLines.slice());
        } else {
            currentTest.solutions = editedLines.slice();
        }
    } catch (error) {
        if (feedback){
            feedback.innerHTML = "Couldn't save: please check the alg format.";
            feedback.style.color = "#ff7b7b";
        }
        return;
    }

    if (feedback){
        feedback.innerHTML = "Saved. Future scrambles will use your edits.";
        feedback.style.color = "#90f182";
    }
}

function randomFromList(set){

    if (document.getElementById("goInOrder").checked){
        return set[currentAlgIndex++%set.length];
    }   

    size = set.length;
    rand = Math.floor(Math.random()*size);

    return set[rand];

}

//Create Checkboxes for each subset
//Each subset has id of subset name, and is followed by text of subset name.

function createAlgsetPicker(){
    var algsetPicker = document.getElementById("algsetpicker")
    for (var set in window.algs){
        var option = document.createElement("option")
        option.text = set;
        algsetPicker.add(option);

    }
    //algsetPicker.size = Object.keys(window.algs).length
}



function createCheckboxes(){

    var set = document.getElementById("algsetpicker").value;


    var full_set = window.algs[set];

    if (!full_set){
        set = document.getElementById("algsetpicker").options[0].value;
        document.getElementById("algsetpicker").value = set;
        full_set = window.algs[set]
    }
    var subsets = Object.keys(full_set);

    var myDiv = document.getElementById("cboxes");

    myDiv.innerHTML = "";

    for (var i = 0; i < subsets.length; i++) {
        var checkBox = document.createElement("input");
        var label = document.createElement("label");
        checkBox.type = "checkbox";
        checkBox.value = subsets[i];
        checkBox.onclick = function(){
            currentAlgIndex = 0;
            shouldRecalculateStatistics=true; 
            //Every time a checkbox is pressed, the algset statistics should be updated.
        }
        checkBox.setAttribute("id", set.toLowerCase() +  subsets[i]);

        myDiv.appendChild(checkBox);
        myDiv.appendChild(label);
        label.appendChild(document.createTextNode(subsets[i]));
    }
}

function clearSelectedAlgsets(){
    var elements = document.getElementById("algsetpicker").options;
    for(var i = 0; i < elements.length; i++){
        elements[i].selected = false;
    }
}

function createAlgList(){
    var algList = [];

    var set = document.getElementById("algsetpicker").value;

    if (set == ""){
        return ["R U R' U' R' F R2 U' R' U' R U R' F'"];
    }

    for (var subset in window.algs[set]){

        if(document.getElementById(set.toLowerCase() + subset).checked){
            algList = algList.concat(window.algs[set][subset]);
        }
    }

    if(algList.length < 1){ //if nothing checked, test on the whole subset
        for (var subset in window.algs[set]){
            algList = algList.concat(window.algs[set][subset]);
        }
        console.log(algList.length + " algs in list");
        return algList;
    }
    console.log(algList.length + " algs in list");

    return algList;
}

function mirrorAlgsAcrossAxis(algList, axis="M"){
    algList = fixAlgorithms(algList);
    if (axis=="M"){
        return algList.map(x => alg.cube.mirrorAcrossM(x));
    }
    else {
        return algList.map(x => alg.cube.mirrorAcrossS(x));
    }
}

function averageMovecount(algList, metric, includeAUF){

    var totalmoves = 0;
    var i = 0;
    for (; i<algList.length; i++){
        var topAlg = algList[i].split("/")[0];
        topAlg = topAlg.replace(/\[|\]|\)|\(/g, "");

        var moves = alg.cube.simplify(alg.cube.expand(alg.cube.fromString(topAlg)));
        
        if (!includeAUF){
            while (moves[0].base === "U" || moves[0].base === "y") {
                moves.splice(0, 1)
            }
            while (moves[moves.length - 1].base === "U" || moves[moves.length - 1].base === "y") {
                moves.splice(moves.length - 1)
            }
        }
        totalmoves += alg.cube.countMoves(moves, {"metric": metric});
    }

    return totalmoves/algList.length;
}

function toggleVirtualCube(){
    var sim = document.getElementById("simcube");

    if (sim.style.display == 'none'){
        sim.style.display = 'block';
    }
    else {
        sim.style.display = 'none';
    }
}

function setVirtualCube(setting){
    var sim = document.getElementById("simcube");
    sim.style.display = setting ? 'block' : 'none';
}

function setCubeMode(mode){
    if (!cubeModes.includes(mode)){
        mode = "flat";
    }
    localStorage.setItem("visualCubeMode", mode);
    var label = document.getElementById("cubeModeLabel");
    var img = document.getElementById("visualcube");
    var useVirtualCheckbox = document.getElementById("useVirtual");

    if (mode === "virtual"){
        setVirtualCube(true);
        if (img){ img.style.display = "none"; }
        if (label){ label.textContent = "Virtual cube"; }
        if (useVirtualCheckbox){ useVirtualCheckbox.checked = true; }
    } else {
        setVirtualCube(false);
        if (img){ img.style.display = "block"; }
        if (mode === "3d"){
            localStorage.setItem("visualCubeView", "");
            if (label){ label.textContent = "3D view"; }
        } else {
            localStorage.setItem("visualCubeView", "plan");
            if (label){ label.textContent = "Flat view"; }
        }
        if (useVirtualCheckbox){ useVirtualCheckbox.checked = false; }
        var algTest = algorithmHistory[historyIndex];
        updateVisualCube(algTest ? algTest.preorientation+algTest.scramble : "");
    }
}

var historyIndex;

function handleLeftButton() {
    if (algorithmHistory.length<=1){
        return;
    }
    historyIndex--;

    if (historyIndex<0){
        historyIndex = 0;
    }
    displayAlgorithmFromHistory(historyIndex);
}

function handleRightButton() {
    historyIndex++;
    if (historyIndex>=algorithmHistory.length){
        nextScramble();
        return;
    }

    displayAlgorithmFromHistory(historyIndex);
}

try { //only for mobile
document.getElementById("onscreenLeft").addEventListener("click", handleLeftButton);
document.getElementById("onscreenRight").addEventListener("click", handleRightButton);
} catch (error) {

}

function resetAnswerUI(targetTest = algorithmHistory[algorithmHistory.length-1]){
    var answerInput = document.getElementById("answerInput");
    if (answerInput){
        answerInput.value = "";
    }
    var feedback = document.getElementById("answerFeedback");
    if (feedback){
        feedback.innerHTML = "&nbsp;";
    }
    var algEditor = document.getElementById("algEditor");
    if (algEditor && targetTest && document.getElementById("algEditorPanel").style.display === "block"){
        algEditor.value = targetTest.appliedAlgs.join("\n");
    }
}

function nextScramble(){
    document.getElementById("scramble").style.color = "white";
    testAlg(generateAlgTest());
    historyIndex = algorithmHistory.length - 1;
    resetAnswerUI();
}

//CUBE OBJECT
function RubiksCube() {
    this.cubestate = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6];

    this.resetCube = function(){
        this.cubestate = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6];
    }
    this.solution = function(){
        var gcube = Cube.fromString(this.toString());
        return gcube.solve();
    }

    this.isSolved = function(){
        for (var i = 0; i<6;i++){
            var colour1 = this.cubestate[9*i];
            for (var j = 0; j<8; j++){
                if (this.cubestate[9*i + j + 1]!=colour1){
                    return false;
                }
            }
        }
        return true;
    }
    this.wcaOrient = function() {
        // u-r--f--d--l--b
        // 4 13 22 31 40 49
        //
        var moves = "";

        if (this.cubestate[13]==1) {//R face
            this.doAlgorithm("z'");
            moves +="z'";
            moves += " ";
        } else if (this.cubestate[22]==1) {//on F face
            this.doAlgorithm("x");
            moves+="x";
            moves += " ";
        } else if (this.cubestate[31]==1) {//on D face
            this.doAlgorithm("x2");
            moves+="x2";
            moves += " ";
        } else if (this.cubestate[40]==1) {//on L face
            this.doAlgorithm("z");
            moves+="z";
            moves += " ";
        } else if (this.cubestate[49]==1) {//on B face
            this.doAlgorithm("x'");
            moves+="x'";
            moves += " ";
        }

        if (this.cubestate[13]==3) {//R face
            this.doAlgorithm("y");
            moves+="y";
            moves += " ";
        } else if (this.cubestate[40]==3) {//on L face
            this.doAlgorithm("y'");
            moves+="y'";
            moves += " ";
        } else if (this.cubestate[49]==3) {//on B face
            this.doAlgorithm("y2");
            moves+="y2";
            moves += " ";
        }

        return moves;
    }
    this.toString = function(){
        var str = "";
        var i;
        var sides = ["U","R","F","D","L","B"]
        for(i=0;i<this.cubestate.length;i++){
            str+=sides[this.cubestate[i]-1];
        }
        return str;

    }


    this.test = function(alg){
        this.doAlgorithm(alg);
        drawCube(this.cubestate);
    }

    this.doAlgorithm = function(alg) {
        if (alg == "") return;

        var moveArr = alg.split(/(?=[A-Za-z])/);
        var i;

        for (i = 0;i<moveArr.length;i++) {
            var move = moveArr[i];
            var myRegexp = /([RUFBLDrufbldxyzEMS])(\d*)('?)/g;
            var match = myRegexp.exec(move.trim());


            if (match!=null) {

                var side = match[1];

                var times = 1;
                if (!match[2]=="") {
                    times = match[2] % 4;
                }

                if (match[3]=="'") {
                    times = (4 - times) % 4;
                }

                switch (side) {
                    case "R":
                        this.doR(times);
                        break;
                    case "U":
                        this.doU(times);
                        break;
                    case "F":
                        this.doF(times);
                        break;
                    case "B":
                        this.doB(times);
                        break;
                    case "L":
                        this.doL(times);
                        break;
                    case "D":
                        this.doD(times);
                        break;
                    case "r":
                        this.doRw(times);
                        break;
                    case "u":
                        this.doUw(times);
                        break;
                    case "f":
                        this.doFw(times);
                        break;
                    case "b":
                        this.doBw(times);
                        break;
                    case "l":
                        this.doLw(times);
                        break;
                    case "d":
                        this.doDw(times);
                        break;
                    case "x":
                        this.doX(times);
                        break;
                    case "y":
                        this.doY(times);
                        break;
                    case "z":
                        this.doZ(times);
                        break;
                    case "E":
                        this.doE(times);
                        break;
                    case "M":
                        this.doM(times);
                        break;
                    case "S":
                        this.doS(times);
                        break;

                }
            } else {

                console.log("Invalid alg, or no alg specified:" + alg + "|");

            }

        }

    }

    this.solveNoRotate = function(){
        //Center sticker indexes: 4, 13, 22, 31, 40, 49
        cubestate = this.cubestate;
        this.cubestate = [cubestate[4],cubestate[4],cubestate[4],cubestate[4],cubestate[4],cubestate[4],cubestate[4],cubestate[4],cubestate[4],
                          cubestate[13],cubestate[13],cubestate[13],cubestate[13],cubestate[13],cubestate[13],cubestate[13],cubestate[13],cubestate[13],
                          cubestate[22],cubestate[22],cubestate[22],cubestate[22],cubestate[22],cubestate[22],cubestate[22],cubestate[22],cubestate[22],
                          cubestate[31],cubestate[31],cubestate[31],cubestate[31],cubestate[31],cubestate[31],cubestate[31],cubestate[31],cubestate[31],
                          cubestate[40],cubestate[40],cubestate[40],cubestate[40],cubestate[40],cubestate[40],cubestate[40],cubestate[40],cubestate[40],
                          cubestate[49],cubestate[49],cubestate[49],cubestate[49],cubestate[49],cubestate[49],cubestate[49],cubestate[49],cubestate[49]];
    }

    this.doU = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.cubestate = [cubestate[6], cubestate[3], cubestate[0], cubestate[7], cubestate[4], cubestate[1], cubestate[8], cubestate[5], cubestate[2], cubestate[45], cubestate[46], cubestate[47], cubestate[12], cubestate[13], cubestate[14], cubestate[15], cubestate[16], cubestate[17], cubestate[9], cubestate[10], cubestate[11], cubestate[21], cubestate[22], cubestate[23], cubestate[24], cubestate[25], cubestate[26], cubestate[27], cubestate[28], cubestate[29], cubestate[30], cubestate[31], cubestate[32], cubestate[33], cubestate[34], cubestate[35], cubestate[18], cubestate[19], cubestate[20], cubestate[39], cubestate[40], cubestate[41], cubestate[42], cubestate[43], cubestate[44], cubestate[36], cubestate[37], cubestate[38], cubestate[48], cubestate[49], cubestate[50], cubestate[51], cubestate[52], cubestate[53]];
        }

    }

    this.doR = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;

            this.cubestate = [cubestate[0], cubestate[1], cubestate[20], cubestate[3], cubestate[4], cubestate[23], cubestate[6], cubestate[7], cubestate[26], cubestate[15], cubestate[12], cubestate[9], cubestate[16], cubestate[13], cubestate[10], cubestate[17], cubestate[14], cubestate[11], cubestate[18], cubestate[19], cubestate[29], cubestate[21], cubestate[22], cubestate[32], cubestate[24], cubestate[25], cubestate[35], cubestate[27], cubestate[28], cubestate[51], cubestate[30], cubestate[31], cubestate[48], cubestate[33], cubestate[34], cubestate[45], cubestate[36], cubestate[37], cubestate[38], cubestate[39], cubestate[40], cubestate[41], cubestate[42], cubestate[43], cubestate[44], cubestate[8], cubestate[46], cubestate[47], cubestate[5], cubestate[49], cubestate[50], cubestate[2], cubestate[52], cubestate[53]]
        }

    }

    this.doF = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.cubestate = [cubestate[0], cubestate[1], cubestate[2], cubestate[3], cubestate[4], cubestate[5], cubestate[44], cubestate[41], cubestate[38], cubestate[6], cubestate[10], cubestate[11], cubestate[7], cubestate[13], cubestate[14], cubestate[8], cubestate[16], cubestate[17], cubestate[24], cubestate[21], cubestate[18], cubestate[25], cubestate[22], cubestate[19], cubestate[26], cubestate[23], cubestate[20], cubestate[15], cubestate[12], cubestate[9], cubestate[30], cubestate[31], cubestate[32], cubestate[33], cubestate[34], cubestate[35], cubestate[36], cubestate[37], cubestate[27], cubestate[39], cubestate[40], cubestate[28], cubestate[42], cubestate[43], cubestate[29], cubestate[45], cubestate[46], cubestate[47], cubestate[48], cubestate[49], cubestate[50], cubestate[51], cubestate[52], cubestate[53]];
        }

    }

    this.doD = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.cubestate = [cubestate[0], cubestate[1], cubestate[2], cubestate[3], cubestate[4], cubestate[5], cubestate[6], cubestate[7], cubestate[8], cubestate[9], cubestate[10], cubestate[11], cubestate[12], cubestate[13], cubestate[14], cubestate[24], cubestate[25], cubestate[26], cubestate[18], cubestate[19], cubestate[20], cubestate[21], cubestate[22], cubestate[23], cubestate[42], cubestate[43], cubestate[44], cubestate[33], cubestate[30], cubestate[27], cubestate[34], cubestate[31], cubestate[28], cubestate[35], cubestate[32], cubestate[29], cubestate[36], cubestate[37], cubestate[38], cubestate[39], cubestate[40], cubestate[41], cubestate[51], cubestate[52], cubestate[53], cubestate[45], cubestate[46], cubestate[47], cubestate[48], cubestate[49], cubestate[50], cubestate[15], cubestate[16], cubestate[17]];
        }

    }

    this.doL = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.cubestate = [cubestate[53], cubestate[1], cubestate[2], cubestate[50], cubestate[4], cubestate[5], cubestate[47], cubestate[7], cubestate[8], cubestate[9], cubestate[10], cubestate[11], cubestate[12], cubestate[13], cubestate[14], cubestate[15], cubestate[16], cubestate[17], cubestate[0], cubestate[19], cubestate[20], cubestate[3], cubestate[22], cubestate[23], cubestate[6], cubestate[25], cubestate[26], cubestate[18], cubestate[28], cubestate[29], cubestate[21], cubestate[31], cubestate[32], cubestate[24], cubestate[34], cubestate[35], cubestate[42], cubestate[39], cubestate[36], cubestate[43], cubestate[40], cubestate[37], cubestate[44], cubestate[41], cubestate[38], cubestate[45], cubestate[46], cubestate[33], cubestate[48], cubestate[49], cubestate[30], cubestate[51], cubestate[52], cubestate[27]];
        }

    }

    this.doB = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.cubestate = [cubestate[11], cubestate[14], cubestate[17], cubestate[3], cubestate[4], cubestate[5], cubestate[6], cubestate[7], cubestate[8], cubestate[9], cubestate[10], cubestate[35], cubestate[12], cubestate[13], cubestate[34], cubestate[15], cubestate[16], cubestate[33], cubestate[18], cubestate[19], cubestate[20], cubestate[21], cubestate[22], cubestate[23], cubestate[24], cubestate[25], cubestate[26], cubestate[27], cubestate[28], cubestate[29], cubestate[30], cubestate[31], cubestate[32], cubestate[36], cubestate[39], cubestate[42], cubestate[2], cubestate[37], cubestate[38], cubestate[1], cubestate[40], cubestate[41], cubestate[0], cubestate[43], cubestate[44], cubestate[51], cubestate[48], cubestate[45], cubestate[52], cubestate[49], cubestate[46], cubestate[53], cubestate[50], cubestate[47]];
        }

    }

    this.doE = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.cubestate = [cubestate[0], cubestate[1], cubestate[2], cubestate[3], cubestate[4], cubestate[5], cubestate[6], cubestate[7], cubestate[8], cubestate[9], cubestate[10], cubestate[11], cubestate[21], cubestate[22], cubestate[23], cubestate[15], cubestate[16], cubestate[17], cubestate[18], cubestate[19], cubestate[20], cubestate[39], cubestate[40], cubestate[41], cubestate[24], cubestate[25], cubestate[26], cubestate[27], cubestate[28], cubestate[29], cubestate[30], cubestate[31], cubestate[32], cubestate[33], cubestate[34], cubestate[35], cubestate[36], cubestate[37], cubestate[38], cubestate[48], cubestate[49], cubestate[50], cubestate[42], cubestate[43], cubestate[44], cubestate[45], cubestate[46], cubestate[47], cubestate[12], cubestate[13], cubestate[14], cubestate[51], cubestate[52], cubestate[53]];
        }

    }

    this.doM = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.cubestate = [cubestate[0], cubestate[52], cubestate[2], cubestate[3], cubestate[49], cubestate[5], cubestate[6], cubestate[46], cubestate[8], cubestate[9], cubestate[10], cubestate[11], cubestate[12], cubestate[13], cubestate[14], cubestate[15], cubestate[16], cubestate[17], cubestate[18], cubestate[1], cubestate[20], cubestate[21], cubestate[4], cubestate[23], cubestate[24], cubestate[7], cubestate[26], cubestate[27], cubestate[19], cubestate[29], cubestate[30], cubestate[22], cubestate[32], cubestate[33], cubestate[25], cubestate[35], cubestate[36], cubestate[37], cubestate[38], cubestate[39], cubestate[40], cubestate[41], cubestate[42], cubestate[43], cubestate[44], cubestate[45], cubestate[34], cubestate[47], cubestate[48], cubestate[31], cubestate[50], cubestate[51], cubestate[28], cubestate[53]];
        }

    }

    this.doS = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.cubestate = [cubestate[0], cubestate[1], cubestate[2], cubestate[43], cubestate[40], cubestate[37], cubestate[6], cubestate[7], cubestate[8], cubestate[9], cubestate[3], cubestate[11], cubestate[12], cubestate[4], cubestate[14], cubestate[15], cubestate[5], cubestate[17], cubestate[18], cubestate[19], cubestate[20], cubestate[21], cubestate[22], cubestate[23], cubestate[24], cubestate[25], cubestate[26], cubestate[27], cubestate[28], cubestate[29], cubestate[16], cubestate[13], cubestate[10], cubestate[33], cubestate[34], cubestate[35], cubestate[36], cubestate[30], cubestate[38], cubestate[39], cubestate[31], cubestate[41], cubestate[42], cubestate[32], cubestate[44], cubestate[45], cubestate[46], cubestate[47], cubestate[48], cubestate[49], cubestate[50], cubestate[51], cubestate[52], cubestate[53]];
        }

    }

    this.doX = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.doR(1);
            this.doM(3);
            this.doL(3);
        }
    }

    this.doY = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;

            this.doU(1);
            this.doE(3);
            this.doD(3);
        }
    }

    this.doZ = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;

            this.doF(1);
            this.doS(1);
            this.doB(3);
        }
    }

    this.doUw = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.doE(3);
            this.doU(1);

        }

    }

    this.doRw = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.doM(3);
            this.doR(1);
        }

    }

    this.doFw = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.doS(1);
            this.doF(1);
        }

    }

    this.doDw = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.doE(1);
            this.doD(1);
        }

    }

    this.doLw = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.doM(1);
            this.doL(1);
        }

    }

    this.doBw = function(times) {
        var i;
        for (i = 0; i < times; i++) {
            cubestate = this.cubestate;
            this.doS(3);
            this.doB(1);
        }

    }
}
