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
const margin = { top: 40, right: 80, bottom: 60, left: 60 };
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
	.range(["green", "pink", "purple", "blue"]);

// Process data for stacking
const processedData = moodsData.map((d) => ({
	day: d.Day,
	dayLabel: d.DayLabel,
	variable: d.VarName,
	...Object.fromEntries(moodKeys.map((key) => [key, d[key]])),
}));

// Create stack generator
const stack = d3
	.stack()
	.keys(moodKeys)
	.order(d3.stackOrderAscending)
	.offset(d3.stackOffsetNone);

const stackedData = stack(processedData);

// Get keys in stack order (ascending), reversed to show top-to-bottom
const stackedKeys = stackedData.map((d) => d.key);

// Track visible series (start with all visible)
const visibleKeys = new Set(stackedKeys);

// Scales
const xScale = d3
	.scaleLinear()
	.domain(d3.extent(processedData, (d) => d.day))
	.range([0, width])
	.nice();

const yScale = d3
	.scaleLinear()
	.domain([0, d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]))])
	.range([height, 0])
	.nice();

// Area generator
const area = d3
	.area()
	.x((d) => xScale(d.data.day))
	.y0((d) => yScale(d[0]))
	.y1((d) => yScale(d[1]))
	.curve(d3.curveMonotoneX);

// Create areas
const areas = g
	.selectAll(".layer")
	.data(stackedData)
	.enter()
	.append("g")
	.attr("class", "layer")
	.attr("data-key", (d) => d.key)
	.attr("fill", (d) => colorScale(d.key));

areas
	.append("path")
	.attr("class", "area")
	.attr("d", area)
	.style("opacity", 0.8)
	.on("mouseover", function (event, d) {
		d3.select(this).style("opacity", 1);
	})
	.on("mouseout", function (event, d) {
		d3.select(this).style("opacity", 0.8);
	});

// Add line overlay for better readability
const line = d3
	.line()
	.x((d) => xScale(d.data.day))
	.y((d) => yScale(d[1]))
	.curve(d3.curveMonotoneX);

// Recompute stacked data based on visibility (hidden series contribute 0)
function getStackedDataForVisibility() {
	const remapped = processedData.map((d) => {
		const copy = { ...d };
		moodKeys.forEach((key) => {
			if (!visibleKeys.has(key)) copy[key] = 0;
		});
		return copy;
	});
	return stack(remapped);
}

function updateStackAndRender() {
	const newStacked = getStackedDataForVisibility();

	// Update Y scale domain based on visible stack
	yScale
		.domain([0, d3.max(newStacked, (layer) => d3.max(layer, (d) => d[1]))])
		.nice();

	// Update axes
	g.select(".axis-y").transition().duration(400).call(d3.axisLeft(yScale));

	// Update grids (recreate to simplify)
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

	// Update layer paths
	const layers = g.selectAll(".layer").data(newStacked, (d) => d.key);
	layers.select("path.area").transition().duration(400).attr("d", area);

	layers
		.select("path.line")
		.transition()
		.duration(400)
		.attr("d", (d) => line(d));
}

areas
	.append("path")
	.attr("class", "line")
	.attr("d", (d) => line(d))
	.attr("fill", "none")
	.attr("stroke", "#fff")
	.attr("stroke-width", 1.5)
	.style("opacity", 0.6);

// Create a mapping from Day to DayLabel for axis labels
const dayLabelMap = new Map(processedData.map((d) => [d.day, d.dayLabel]));

// Get all unique day values for tick values
const allDays = processedData.map((d) => d.day);

// X Axis - use Day for positioning but display DayLabel
const xAxis = d3
	.axisBottom(xScale)
	.tickValues(allDays)
	.tickFormat((d) => dayLabelMap.get(d) || d);

g.append("g")
	.attr("class", "axis axis-x")
	.attr("transform", `translate(0,${height})`)
	.call(xAxis);

g.append("text")
	.attr("class", "axis-label")
	.attr("transform", `translate(${width / 2}, ${height + 45})`)
	.style("text-anchor", "middle")
	.text("Day");

// Y Axis
const yAxis = d3.axisLeft(yScale);

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

// Tooltip
const tooltip = d3.select("#tooltip");

// Add invisible overlay for tooltip
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

		// Calculate values for tooltip only for visible series
		let totalVisible = 0;
		const tooltipItems = stackedKeys
			.filter((key) => visibleKeys.has(key))
			.map((key) => {
				const value = closest[key];
				totalVisible += value;
				return { key, value };
			});

		tooltip
			.style("left", event.pageX + 10 + "px")
			.style("top", event.pageY - 10 + "px")
			.html(
				`
							<div class="tooltip-title">${`[${closest.day}] ${closest.dayLabel}`}</div>
							${tooltipItems
								.map(
									(d) => `
										<div class="tooltip-item">
											<span style="color: ${colorScale(d.key)}">●</span>
											${d.key}: ${d.value.toFixed(2)}
										</div>
									`
								)
								.join("")}
							<div class="tooltip-item" style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.3);">
								<strong>Total: ${totalVisible.toFixed(2)}</strong>
							</div>
				`
			)
			.style("opacity", 1);
	})
	.on("mouseout", function () {
		tooltip.style("opacity", 0);
	});

// Create legend in the same order as the stack (ascending order, reversed to show top-to-bottom)
const legend = d3.select("#legend");
stackedKeys.forEach((key) => {
	const item = legend
		.append("div")
		.attr("class", "legend-item")
		.style("cursor", "pointer")
		.on("click", function () {
			const isVisible = visibleKeys.has(key);
			if (isVisible) {
				visibleKeys.delete(key);
				d3.select(this).style("opacity", 0.4);
				g.selectAll(".layer")
					.filter((d) => d.key === key)
					.style("display", "none");
				updateStackAndRender();
			} else {
				visibleKeys.add(key);
				d3.select(this).style("opacity", 1);
				g.selectAll(".layer")
					.filter((d) => d.key === key)
					.style("display", null);
				updateStackAndRender();
			}
		});

	item
		.append("div")
		.attr("class", "legend-color")
		.style("background-color", colorScale(key));

	item.append("span").text(key);
});
