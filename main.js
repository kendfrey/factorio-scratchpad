"use strict";

const s = 32;
const w = 48;
const h = 27;

const menu = document.querySelector("#menu");
const canvas = document.querySelector("canvas");
canvas.width = w * s;
canvas.height = h * s;
const ctx = canvas.getContext("2d");
let tile;
let entities;
const cur = { entity: 0, variant: 0, r: 0, x: -1, y: -1 };
let map = Array(w * h).fill(null);

setup();

async function setup()
{
	tile = await createImageBitmap(await getImage("tile"));

	entities = await getJSON("entities.json");
	for (const entity of entities)
	{
		entity.images = {};
		for (const variant of entity.variants)
		{
			const image = await getImage(`${entity.name}-${variant}`);
			image.width = s;
			image.height = s;
			entity.images[variant] = image;
		}
		menu.appendChild(entity.images[entity.variants[0]]);
	}

	setupEvents();
	render();
}

function setupEvents()
{
	menu.childNodes[cur.entity].classList.add("selected");
	window.addEventListener("wheel", e =>
	{
		menu.childNodes[cur.entity].classList.remove("selected");
		if (e.deltaY > 0 && cur.entity < entities.length - 1)
		{
			cur.entity++;
			cur.variant = 0;
		}
		else if (e.deltaY < 0 && cur.entity > 0)
		{
			cur.entity--;
			cur.variant = 0;
		}
		menu.childNodes[cur.entity].classList.add("selected");
	});
	const mouseevent = e =>
	{
		const rect = canvas.getBoundingClientRect();
		cur.x = Math.floor((e.clientX - rect.left) / s);
		cur.y = Math.floor((e.clientY - rect.top) / s);
		if (e.buttons & 1)
		{
			map[cur.y * w + cur.x] = { entity: entities[cur.entity], variant: entities[cur.entity].variants[cur.variant], r: cur.r };
		}
		else if (e.buttons & 2)
		{
			map[cur.y * w + cur.x] = null;
		}
	};
	canvas.addEventListener("contextmenu", e => e.preventDefault());
	canvas.addEventListener("mousemove", mouseevent);
	canvas.addEventListener("mousedown", mouseevent);
	canvas.addEventListener("mouseleave", e => cur.x = cur.y = -1);
	window.addEventListener("keydown", e =>
	{
		if (e.key === "r")
		{
			cur.r++;
			cur.r %= 4;
		}
		if (e.key === "f")
		{
			cur.variant++;
			cur.variant %= entities[cur.entity].variants.length;
		}
	});
}

function render()
{
	for (let x = 0; x < w; x++)
	{
		for (let y = 0; y < h; y++)
		{
			ctx.drawImage(tile, x * s, y * s);
		}
	}
	for (let x = 0; x < w; x++)
	{
		for (let y = 0; y < h; y++)
		{
			let entity = map[y * w + x];
			if (x === cur.x && y === cur.y)
			{
				entity = { entity: entities[cur.entity], variant: entities[cur.entity].variants[cur.variant], r: cur.r };
			}
			if (entity)
			{
				const r = entity.r * Math.PI * 0.5;
				const r_ = r + Math.PI * 0.25;
				ctx.setTransform(Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), (x - Math.cos(r_) * Math.sqrt(0.5) + 0.5) * s, (y - Math.sin(r_) * Math.sqrt(0.5) + 0.5) * s);
				ctx.drawImage(entity.entity.images[entity.variant], 0, 0);
				ctx.resetTransform();
			}
		}
	}
	requestAnimationFrame(render);
}

function getJSON(url)
{
	return new Promise((resolve, reject) =>
	{
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () =>
		{
			if (xhr.readyState === 4)
			{
				if (xhr.status === 200)
				{
					resolve(xhr.response);
				}
				else
				{
					reject(xhr.status);
				}
			}
		};
		xhr.responseType = "json";
		xhr.open("GET", url);
		xhr.send();
	});
}

function getImage(name)
{
	return new Promise((resolve, reject) =>
	{
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject();
		image.src = `img/${name}.png`;
	});
}
