export class VisualFunThing {
  constructor() {
    this.margin = {top: 10, right: 30, bottom: 90, left: 40};
    this.width = 460 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.svg = null;
  };

  generateData() {
    let data = [];
    for (let i = 0; i < 8; i++) {
      data.push({
        Drum: `drum-${i}`,
        Value: parseInt(Math.random() * 100).toString(),
      });
    }
    return data;
  };

  reset() {
    document.querySelector('#visual').innerHTML = '';

    // append the svg object to the body of the page
    this.svg = d3.select("#visual")
      .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + this.margin.left + "," + this.margin.top + ")");
  };

  play() {
    this.reset();

    const data = this.generateData();

    // X axis
    var x = d3.scaleBand()
      .range([ 0, this.width ])
      .domain(data.map(function(d) { return d.Drum; }))
      .padding(1);

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, 100])
      .range([ this.height, 0]);

    // Lines
    this.svg.selectAll("myline")
      .data(data)
      .enter()
      .append("line")
      .attr("x1", function(d) { return x(d.Drum); })
      .attr("x2", function(d) { return x(d.Drum); })
      .attr("y1", function(d) { return y(d.Value); })
      .attr("y2", y(0))
      .attr("stroke", "grey")

    // Circles
    this.svg.selectAll("mycircle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", function(d) { return x(d.Drum); })
      .attr("cy", function(d) { return y(d.Value); })
      .attr("r", "4")
      .style("fill", "#69b3a2")
      .attr("stroke", "black");
  };
};
