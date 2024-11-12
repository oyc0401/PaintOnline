console.log('JS 실행:','copy-inkscape-labels.js')

async function fetchSVGText(url) {
	const response = await fetch(url);
	const text = await response.text();
	return text.replace(/<!-- Code injected by live-server -->[\s\S]*<\/script>\n?/m, "");
}

async function applyLabels(sourceURL, targetURL) {
	const sourceSVG = await fetchSVGText(sourceURL);
	let targetSVG = await fetchSVGText(targetURL);

	// Find all elements with inkscape:label
	const labeledOpeningTags = sourceSVG.match(/<[^>]+\sinkscape:label="([^"]+)"[^>]*>/g) || [];

	// Apply labels from first SVG to corresponding elements in the second SVG
	for (const labeledOpeningTag of labeledOpeningTags) {
		const label = labeledOpeningTag.match(/inkscape:label="([^"]+)"/)[1];
		const idMatch = labeledOpeningTag.match(/id="([^"]+)"/);
		if (idMatch) {
			const id = idMatch[1];
			const regex = new RegExp(`<[^>]+id="${id}"[^>]*>`);
			targetSVG = targetSVG.replace(regex, (match) => {
				if (match.includes("inkscape:label")) {
					return match.replace(/inkscape:label="[^"]+"/, `inkscape:label="${label}"`);
				} else {
					return match.replace(/(\s*)(\/?)>$/, (_match, whitespace, slash) =>
						`${whitespace || " "}inkscape:label="${label}"${slash}>`
					);
				}
			});
		}
	}

	// Output the resulting XML
	return targetSVG;
}

(async () => {
	console.log(await applyLabels("images/classic/tools.svg", "images/dark/tools.svg"));
})();
