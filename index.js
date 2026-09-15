import fs from "fs"
import path from "path"
import { spawn } from "child_process"

function escapeHtml(text) {
	return String(text ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
    }

function escapeAttr(text) {
	return escapeHtml(text).replace(/"/g, "&quot;")
}

export function bold(text) {
	return `<b>${escapeHtml(text)}</b>`
}

export function italic(text) {
	return `<i>${escapeHtml(text)}</i>`
}

export function underline(text) {
	return `<u>${escapeHtml(text)}</u>`
}

export function strike(text) {
	return `<s>${escapeHtml(text)}</s>`
}

export function spoiler(text) {
	return `<tg-spoiler>${escapeHtml(text)}</tg-spoiler>`
}

export function code(text) {
	return `<code>${escapeHtml(text)}</code>`
}

export function pre(text, lang) {
	const cls = lang ? ` class="language-${escapeAttr(lang)}"` : ""
	return `<pre><code${cls}>${escapeHtml(text)}</code></pre>`
}

export function link(text, url) {
	return `<a href="${escapeAttr(url)}">${escapeHtml(text)}</a>`
}

export function formatSize(bytes) {
	if (!bytes || bytes < 0) return "0 B"
	const units = ["B", "KB", "MB", "GB", "TB"]
	let size = bytes
	let i = 0
	while (size >= 1024 && i < units.length - 1) {
		size /= 1024
		i++
	}
	return `${size.toFixed(i > 0 && size < 10 ? 2 : 0)} ${units[i]}`
}

export function onTime(ms) {
	let total = Math.floor(ms / 1000)

	const days = Math.floor(total / 86400); total %= 86400
	const hours = Math.floor(total / 3600); total %= 3600
	const minutes = Math.floor(total / 60)
	const seconds = total % 60

	const pad = n => String(n).padStart(2, "0")
	const parts = []

	if (days) parts.push(`${days}d`)
	if (days || hours) parts.push(`${pad(hours)}h`)
	if (days || hours || minutes) parts.push(`${pad(minutes)}m`)
	parts.push(`${pad(seconds)}s`)

	return parts.join(":")
}

export function mask(text) {
	if (!text) return text
	const str = String(text)
	const hasAt = str.startsWith("@")
	const body = hasAt ? str.slice(1) : str

	if (body.length <= 6) return str

	return (hasAt ? "@" : "") + body.slice(0, 3) + "×××××" + body.slice(-3)
}

export function formatError(pluginName, err) {
	const stack = (err?.stack || err?.message || String(err)).slice(0, 3500)
	return `${bold(pluginName)}\n${pre(stack)}`
}

export function isBuffer(x) {
	return Buffer.isBuffer(x)
}

export function isDirectUrl(url) {
	if (typeof url !== "string") return false
	const clean = url.split("?")[0].toLowerCase()
	return /\.(mp4|mkv|mov|webm|mp3|ogg|wav|m4a|jpg|jpeg|png|webp|gif|pdf)$/.test(clean)
}

export async function sendMedia(ctx, source, options = {}) {
	const { type = "document", caption, convert, tempDir = "./temp", track } = options

	let payload

	if (isBuffer(source)) {
		payload = { source }
	} else if (typeof source === "string" && !convert) {
		payload = { url: source }
	} else if (typeof source === "string" && convert) {
		if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

		const downloadPath = path.join(tempDir, `dl_${Date.now()}`)
		const res = await fetch(source)
		if (!res.ok) throw new Error(`sendMedia: no se pudo descargar (${res.status})`)
		const buf = Buffer.from(await res.arrayBuffer())
		fs.writeFileSync(downloadPath, buf)

		const outputPath = path.join(tempDir, `out_${Date.now()}${convert.outputExt || ""}`)

		await new Promise((resolve, reject) => {
			const proc = spawn("ffmpeg", ["-y", "-i", downloadPath, ...(convert.args || []), outputPath])
			if (track) track(proc)
			proc.on("close", code => code === 0 ? resolve() : reject(new Error(`${code}`)))
			proc.on("error", reject)
		})

		payload = { source: outputPath }
	} else {
		throw new Error("sendMedia: invalid source.")
	}

	const extra = caption ? { caption, parse_mode: "HTML" } : {}

	switch (type) {
		case "video": return ctx.replyWithVideo(payload, extra)
		case "audio": return ctx.replyWithAudio(payload, extra)
		case "photo": return ctx.replyWithPhoto(payload, extra)
		default: return ctx.replyWithDocument(payload, extra)
	}
}

export const utils = {
 bold, italic, underline, strike, spoiler, code, pre, link,
 formatSize, onTime, mask, formatError, isBuffer, isDirectUrl, sendMedia
}

export default utils
