var PSOdemo = function() {
'use strict';

    var canvas, con2d;
    var pso = new PSO();
    var iteration = 0;
    var domain = null;

    var config = new function() {
        this.start = start;
        this.stop = stop;
        this.best = '';
        this.max = '';
        this.delay = 100;
        this.iterationNMax = 20;
        this.circle = true;
        this.func = 0;
    };

    var fundom = [
        { fun: function(x) { return Math.cos(Math.PI * 2 * x[0]) * 5 - Math.pow(x[0], 2); }, domain: [new Interval(-5.12,5.12)] },
        { fun: function(x) { return -Math.cos(x[0])*Math.exp(-Math.pow(x - Math.PI, 2)); }, domain: [new Interval(-30,30)] },
        { fun: function(x) { return Math.exp(-Math.pow(x[0] - 5, 2)) * 20 + Math.cos(x[0] * 10); }, domain: [new Interval(-10,10)] },
        { fun: function(x) { return -x[0]*x[0]; }, domain: [new Interval(-5,5)] }
    ];

    var nSamples = 500;
    var timeoutId = null;
    var running = false;
    var yscale = 1.0;

    setup();

    function setup() {
        canvas = document.getElementById('canvaspso');
        con2d = canvas.getContext('2d');

        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight - 25;
        yscale = canvas.height / 300.0;

        var gui = new dat.GUI({width:300,autoPlace:false});
        gui.add(config, 'start').name('Start the search');
        gui.add(config, 'stop').name('Stop the search');
        gui.add(config, 'best').name('Best f(x)').listen();
        gui.add(config, 'max').name('Best so far').listen();

        var params = gui.addFolder('Parameters');
        params.add(config, 'delay', 10, 100).name('Delay (ms)');
        params.add(config, 'iterationNMax', 10, 100).name('Num of Iterations');

        params.add(pso, 'nParticles', 1, 100).name('Population');
        params.add(pso, 'inertiaWeight', 0, 1, 0.1).name('Inertia weight');
        params.add(pso, 'social', 0, 1, 0.1).name('Social influence');
        params.add(pso, 'personal', 0, 1, 0.1).name('Personel influence');

        params.add(config, 'circle').name('Circle marker');

        gui.add(config, 'func')
            .options({
                'Rastrigin (x in [-5.12,5.12])':0,
                'Easom (x in [-30,30])':1,
                'exp(-(x-5)^2)*20 + cos(x*10) (x in [-10,10])':2,
                'x^2 (x in [-5,5])':3 })
            .name('Function to maximize')
            .onChange(updateFunction);

        document.body.appendChild(gui.domElement);
        gui.domElement.style.position = 'absolute';
        gui.domElement.style.top = '0px';
        gui.domElement.style.right = '0px';

        updateFunction(config.func);
    }

    function step() {
        pso.step();     
        drawFunction();     
        drawPopulation(1.2, '#1FA', pso.getParticlesBest());
        drawPopulation(1, '#F04', pso.getParticles());
        drawBest();
    }

    function drawLine(x1, y1, x2, y2) {
        var rap = canvas.width / (domain[0].end - domain[0].start);
        var cy = canvas.height / 2;
        var ax = canvas.width / nSamples;
        var x1 = (x1 - domain[0].start) * rap;
        var y1 = cy - y1 * ax * yscale;
        var x2 = (x2 - domain[0].start) * rap;
        var y2 = cy - y2 * ax * yscale;

        con2d.moveTo(x1, y1);
        con2d.lineTo(x2, y2);
    }

    function drawVerticalLine(x) {
        var rap = canvas.width / (domain[0].end - domain[0].start);
        var x = (x - domain[0].start) * rap;

        con2d.moveTo(x, 0);
        con2d.lineTo(x, canvas.height);
    }

    function drawCircle(x, y) {
        var rap = canvas.width / (domain[0].end - domain[0].start);
        var cy = canvas.height / 2;
        var ax = canvas.width / nSamples;
        var x1 = (x - domain[0].start) * rap;
        var y1 = cy - y * ax * yscale;

        con2d.beginPath();
        con2d.arc(x1, y1, 5, 0, Math.PI*2, true);
        con2d.closePath();
        con2d.stroke();
    }

    function drawPopulation(lineWidth, strokeStyle, particlePositions){
        var rap = canvas.width / (domain[0].end - domain[0].start);
        con2d.lineWidth = lineWidth;        
        con2d.strokeStyle = strokeStyle;
        
        con2d.beginPath();
        particlePositions.forEach(function(particlePosition) {
            if (config.circle)
                drawCircle(particlePosition[0], pso.objectiveFunction(particlePosition));
            else
                drawVerticalLine(particlePosition[0]);
        });
        con2d.stroke();
    }

    function drawBest() {
        con2d.lineWidth = 1.5;      
        con2d.strokeStyle = '#05F';
        
        con2d.beginPath();
        drawVerticalLine(pso.getBestPosition());
        con2d.stroke();
    }

    function drawFunction() {
        con2d.fillStyle = '#FFF';
        con2d.fillRect(0, 0, canvas.width, canvas.height);
        
        con2d.strokeStyle = '#888';
        con2d.lineWidth = 2.2;
         
        con2d.beginPath();
        var lastx, lasty;
        for(var x=domain[0].start; x<=domain[0].end; x+=(domain[0].end-domain[0].start)/nSamples) {
            if (lastx) drawLine(lastx, lasty, x, pso.objectiveFunction([x]));
            lastx = x; lasty = pso.objectiveFunction([x]);
        }
        con2d.stroke();
    }

    function theGreatLoop() {
        if (running) {
            step();
            config.best ='f('+pso.getBestPosition()+')';
            config.max = pso.objectiveFunction(pso.getBestPosition());

            iteration++;
            if (iteration < config.iterationNMax) {
                timeoutId = setTimeout(theGreatLoop,config.delay);
            } else {
                running = false;
            }
        }
    }

    function start() {
        if (!running) {
            running = true;

            iteration = 0;
            pso.init(domain);
            theGreatLoop();
        }
    }

    function stop() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        running = false;
    }

    function updateFunction(index) {  
        stop();
        
        pso.objectiveFunction = fundom[index].fun;
        domain = fundom[index].domain;
        drawFunction();
    }
    //start();
};

window.onload = function(){
    var app = new PSOdemo();
}
