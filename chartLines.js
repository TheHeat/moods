// Load and process the CSV data
const moodsData = await d3.csv("MoodsFreshCycle.csv", (d) => ({
	Day: +d.day,
	DayLabel: d.dayLabel,
	VarName: d.varName,
	Threat: +d.Threat,
	Harm: +d.Harm,
	Challenge: +d.Challenge,
	Benefit: +d.Benefit,
}));

// Set up dimensions and margins
const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG
const svg = d3
	.select("#chart")
	.append("svg")
	.attr(
		"viewBox",
		`0 0 ${width + margin.left + margin.right} ${
			height + margin.top + margin.bottom
		}`
	);

const g = svg
	.append("g")
	.attr("transform", `translate(${margin.left},${margin.top})`);

// Prepare data
const moodKeys = ["Threat", "Harm", "Challenge", "Benefit"];
const colorScale = d3
	.scaleOrdinal()
	.domain(moodKeys)
	.range(["#d16f1eff", "#8538b6ff", "#32b681ff", "#46a8d8ff"]);

const processedData = moodsData.map((d) => ({
	day: d.Day,
	dayLabel: d.DayLabel,
	variable: d.VarName,
	...Object.fromEntries(moodKeys.map((key) => [key, d[key]])),
}));

// Create series for each mood key
const series = moodKeys.map((key) => ({
	key,
	values: processedData.map((d) => ({
		day: d.day,
		value: d[key],
		dayLabel: d.dayLabel,
	})),
}));

// Track visible series (start with all visible)
const visibleKeys = new Set(moodKeys);

// Scales
const xScale = d3
	.scaleLinear()
	.domain(d3.extent(processedData, (d) => d.day))
	.range([0, width])
	.nice();

const yScale = d3
	.scaleLinear()
	.domain([0, d3.max(series, (s) => d3.max(s.values, (d) => d.value))])
	.range([height, 0])
	.nice();

// Line generator (per series)
const line = d3
	.line()
	.x((d) => xScale(d.day))
	.y((d) => yScale(d.value));
// .curve(d3.curveMonotoneX);

// Area under the line (subtle fill) - optional, low opacity
// const area = d3
// 	.area()
// 	.x((d) => xScale(d.day))
// 	.y0(yScale(0))
// 	.y1((d) => yScale(d.value))
// 	.curve(d3.curveMonotoneX);

// Create axes
const allDays = processedData.map((d) => d.day);
const dayLabelMap = new Map(processedData.map((d) => [d.day, d.dayLabel]));

const xAxis = d3
	.axisBottom(xScale)
	.tickValues(allDays)
	.tickFormat((d) => dayLabelMap.get(d) || d);

const yAxis = d3.axisLeft(yScale);

g.append("g")
	.attr("class", "axis axis-x")
	.attr("transform", `translate(0,${height})`)
	.call(xAxis);

g.append("text")
	.attr("class", "axis-label")
	.attr("transform", `translate(${width / 2}, ${height + 45})`)
	.style("text-anchor", "middle")
	.text("Day");

g.append("g").attr("class", "axis axis-y").call(yAxis);

g.append("text")
	.attr("class", "axis-label")
	.attr("transform", "rotate(-90)")
	.attr("y", -45)
	.attr("x", -height / 2)
	.style("text-anchor", "middle")
	.text("Value");

// Add grid lines
g.append("g")
	.attr("class", "grid")
	.attr("transform", `translate(0,${height})`)
	.call(
		d3.axisBottom(xScale).tickValues(allDays).tickSize(-height).tickFormat("")
	)
	.style("stroke-dasharray", "3,3")
	.style("opacity", 0.2);

g.append("g")
	.attr("class", "grid")
	.call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
	.style("stroke-dasharray", "3,3")
	.style("opacity", 0.2);

// Add vertical markers for specific days
const markerDays = [7, 15, 29];
markerDays.forEach((day) => {
	g.append("line")
		.attr("class", "vertical-marker")
		.attr("x1", xScale(day))
		.attr("x2", xScale(day))
		.attr("y1", 0)
		.attr("y2", height)
		.style("stroke", "black")
		.style("stroke-width", 2)
		.style("stroke-dasharray", "5,5")
		.style("opacity", 0.7)
		.style("pointer-events", "none");
});

// Container for lines
const linesG = g.append("g").attr("class", "lines");

const seriesG = linesG
	.selectAll(".series")
	.data(series, (d) => d.key)
	.enter()
	.append("g")
	.attr("class", "series")
	.attr("data-key", (d) => d.key)
	.style("fill", "none")
	.style("stroke", (d) => colorScale(d.key));

seriesG
	.append("path")
	.attr("class", "line")
	.attr("d", (d) => line(d.values))
	.style("stroke-width", 2);

// Optional subtle area fill under each line
seriesG
	.append("path")
	.attr("class", "area-fill")
	.attr("d", (d) => area(d.values))
	.style("fill", (d) => colorScale(d.key))
	.style("opacity", 0.08);

// Add circles for points
seriesG
	.selectAll("circle.point")
	.data((d) => d.values.map((v) => ({ key: d.key, ...v })))
	.enter()
	.append("circle")
	.attr("class", "point")
	.attr("r", 3)
	.attr("cx", (d) => xScale(d.day))
	.attr("cy", (d) => yScale(d.value))
	.style("fill", (d) => colorScale(d.key))
	.style("opacity", 0.9);

// Tooltip
const tooltip = d3.select("#tooltip");

// Overlay for capture
const overlay = g
	.append("rect")
	.attr("width", width)
	.attr("height", height)
	.style("fill", "none")
	.style("pointer-events", "all")
	.on("mousemove", function (event) {
		const [x] = d3.pointer(event);
		const day = xScale.invert(x);

		// Find closest data point
		const closest = processedData.reduce((prev, curr) =>
			Math.abs(curr.day - day) < Math.abs(prev.day - day) ? curr : prev
		);

		// Prepare tooltip items for visible series
		let totalVisible = 0;
		const tooltipItems = series
			.filter((s) => visibleKeys.has(s.key))
			.map((s) => {
				const v = closest[s.key];
				totalVisible += v;
				return { key: s.key, value: v };
			});

		tooltip
			.style("left", event.pageX + 10 + "px")
			.style("top", event.pageY - 10 + "px")
			.html(
				`
                    <div class="tooltip-title">${`[${closest.day}] ${closest.dayLabel}`}</div>
                    <div class="tooltip-content">
                        <div id="tooltip-bar"></div>
                        <div>
                            ${tooltipItems
															.map(
																(d) => `
                                        <div class="tooltip-item">
                                            <span style="color: ${colorScale(
																							d.key
																						)}">●</span>
                                            ${d.key}: ${d.value.toFixed(2)}
                                        </div>
                                    `
															)
															.join("")}
                            <div class="tooltip-item">
                                <strong>Total: ${totalVisible.toFixed(
																	2
																)}</strong>
                            </div>
                        </div>
                    </div>
                `
			)
			.call((tooltip) => {
				d3.select("#tooltip-bar").selectAll("*").remove();

				const barWidth = 160;
				const barHeight = 20;

				const total = tooltipItems.reduce((sum, item) => sum + item.value, 0);
				if (total <= 0) return;

				let cumulative = 0;
				const barData = tooltipItems.map((item) => {
					const percentage = item.value / total;
					const start = cumulative;
					cumulative += percentage;
					return { key: item.key, start, end: cumulative, value: item.value };
				});

				const barSvg = d3
					.select("#tooltip-bar")
					.append("svg")
					.attr("width", barWidth)
					.attr("height", barHeight);

				barSvg
					.selectAll("rect")
					.data(barData)
					.enter()
					.append("rect")
					.attr("x", (d) => d.start * barWidth)
					.attr("y", 0)
					.attr("width", (d) => (d.end - d.start) * barWidth)
					.attr("height", barHeight)
					.attr("fill", (d) => colorScale(d.key))
					.attr("stroke", "white")
					.attr("stroke-width", "1px");
			})
			.style("opacity", 1);
	})
	.on("mouseout", function () {
		tooltip.style("opacity", 0);
	});

// Legend with toggles
const legend = d3.select("#legend");
moodKeys.forEach((key) => {
	const item = legend
		.append("button")
		.attr("type", "button")
		.attr("class", "legend-item")
		.attr("aria-pressed", "true")
		.on("click", function () {
			const isVisible = visibleKeys.has(key);
			if (isVisible) {
				visibleKeys.delete(key);
				d3.select(this).style("opacity", 0.4).attr("aria-pressed", "false");
				g.selectAll(".series")
					.filter((d) => d.key === key)
					.style("display", "none");
			} else {
				visibleKeys.add(key);
				d3.select(this).style("opacity", 1).attr("aria-pressed", "true");
				g.selectAll(".series")
					.filter((d) => d.key === key)
					.style("display", null);
			}
			updateChart();
		});

	item
		.append("div")
		.attr("class", "legend-color")
		.style("background-color", colorScale(key));

	item.append("span").text(key);
});

// Update function: recompute y-domain based on visible series and transition
function updateChart() {
	// compute max across visible series
	const visibleSeries = series.filter((s) => visibleKeys.has(s.key));
	let newMax = 1;
	if (visibleSeries.length > 0) {
		newMax = d3.max(visibleSeries, (s) => d3.max(s.values, (d) => d.value));
	} else {
		newMax = 1; // avoid zero domain
	}

	yScale.domain([0, newMax]).nice();

	// update y axis
	g.select(".axis-y").transition().duration(400).call(d3.axisLeft(yScale));

	// update grid
	g.selectAll("g.grid").remove();
	g.append("g")
		.attr("class", "grid")
		.attr("transform", `translate(0,${height})`)
		.call(
			d3.axisBottom(xScale).tickValues(allDays).tickSize(-height).tickFormat("")
		)
		.style("stroke-dasharray", "3,3")
		.style("opacity", 0.2);

	g.append("g")
		.attr("class", "grid")
		.call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
		.style("stroke-dasharray", "3,3")
		.style("opacity", 0.2);

	// update lines
	g.selectAll(".series").each(function (s) {
		const sel = d3.select(this);
		sel
			.select("path.line")
			.transition()
			.duration(400)
			.attr("d", line(s.values));
		sel
			.select("path.area-fill")
			.transition()
			.duration(400)
			.attr("d", area(s.values));
		sel
			.selectAll("circle.point")
			.transition()
			.duration(400)
			.attr("cx", (d) => xScale(d.day))
			.attr("cy", (d) => yScale(d.value));
	});
}

// Initial render complete (chart already drawn). Mark todo items accordingly.
