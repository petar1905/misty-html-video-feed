let canvas = document.getElementById("stream-canvas");

let imageWidth = 400; 
let imageHeight = 540;

async function connect(ip) {
    const response = await fetch(`http://${ip}/api/videostreaming/start`, {
        method: "POST",
        body: JSON.stringify({
            "Port": 5678,
            "Rotation": 90,
            "Width": imageWidth,
            "Height": imageHeight,
            "Quality": 5
        })
    });
  console.log(response);

  if (response.status === 200) {
    let ws = new WebSocket(`ws://${ip}:5678`);
    console.log("Created socket");

    ws.onopen = (evt) => {
        console.log("Opened socket");
        console.log(evt);
    };

    ws.onerror = (evt) => {
        console.log("Error opening socket:");
        console.log(evt);
    };

    ws.onclose = (evt) => {
        console.log(evt);
        fetch(`http://${ip}/api/videostreaming/stop`, {
            method: "POST"
        });
        console.log("Closed socket");
    };

    ws.onmessage = (evt) => {
        console.log("Incoming message");
        console.log(evt);
		drawMessage(evt);
    };
  }
}

function drawMessage(evt) {
	console.log(canvas);
	if (canvas == null) {
		return;
	}

	let context = canvas.getContext("2d");
	let blob = new Blob([evt.data], { type: "image/jpeg" });
	createImageBitmap(blob, 0, 0, imageWidth, imageHeight).then((img) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.drawImage(img, 0, 0, imageWidth, imageHeight, 0, 0, canvas.width, canvas.height);
	});
}

async function restartMisty(ip) {
    const response = await fetch(`http://${ip}/api/reboot`, {
        method: "POST",
        body: JSON.stringify({
            "Core": false,
            "SensoryServices": true
        })
    });
    return response;
}

/*  
    ВАЖНО: Стрийминг услугата, използвана от Misty, е в алфа версия, както е споменато в документацията. 
    https://docs.mistyrobotics.com/misty-ii/web-api/api-reference/#startvideostreaming
    Трябва да се знае, че при стартиране на стрийм от гореспоменатата API точка, може да се наблюдава само
    от един клиент в даден момент,  и при рефреш на уеб страницата не може да се достъпи потокът от камерата отново.
    Workaround за това ограничение е рестартиране на робота през API точката /api/reboot, но недостатъкът е, че
    всеки път рефреш трябва се спре текущият стрийм и да се чакат около 50 секунди за да се пусне нов.

    Стремете се камерата на всеки робот да се наблюдава САМО от един клиент (в този случай прозорец на бразуера) 
    и да се избягват рефрешове на уеб страницата!!!

    - Петър Владов №20524
*/

let ip = prompt("What is Misty's IP address?");

let restartConfirmation = confirm("Would you like to restart Misty? It will take approximately 50 seconds.\nAfter that, the camera feed will automatically start.");

if (restartConfirmation == true) {
    console.log("Restarting Misty...");
    restartMisty(ip);
}

setTimeout(() => {
    connect(ip);
}, 50*1000);