/*
 pso.js 0.1 Copyright (c) 2013, Adrian Toncean
 Available via the MIT or new BSD license
*/

var Interval = function(start, end){
    this.start = start;
    this.end = end;
}

var Particle = function(position, velocity, inertiaWeight, social, personal) {
    var bestPosition;

    this.position = position;
    this.fitness = -Infinity;
    this.bestFitness = -Infinity;

    this.storePosition = storePosition;
    this.getPosition = getPosition;
    this.updateVelocity = updateVelocity;
    this.updatePosition = updatePosition;
    this.getBestPosition = getBestPosition;

    function storePosition() {
        bestPosition = position.slice(0);
    }

    function getPosition() {
        return position.slice(0);
    }
    
    function getBestPosition() {
        return bestPosition.slice(0);
    }

    function updateVelocity(globalBest) {
        for (var i = 0; i < position.length; i++) {
            velocity[i] = velocity[i] * inertiaWeight + 
                (globalBest.position[i] - position[i]) * Math.random() * social + 
                (bestPosition[i] - position[i]) * Math.random() * personal;
        }
    }

    function updatePosition() {
        for (var i = 0; i < position.length; i++) {
            position[i] += velocity[i];
        }
    }
};

var PSO = function() {
    var particles;
    var bestPositionEver = null;
    var bestFitnessEver = -Infinity;
    var pressure = 0.5;

    this.objecttiveFunction = null;
    this.iteration = 0;
    this.nParticles = 50;
 
    this.inertiaWeight = 0.6;
    this.social = 0.7;
    this.personal = 0.3;

    this.init = init;
    this.step = step;
    this.getParticles = getParticles;
    this.getParticlesBest = getParticlesBest;
    this.getBestPosition = getBestPosition;

    function createRandom(domain, pso, velocityMultiplier) {
        velocityMultiplier = (typeof(velocityMultipler) === 'undefined') ? 0.1 : velocityMultiplier; 
        var position = domain.map(function(d){ return (Math.random() * (d.end - d.start) + d.start); });
        var velocity = domain.map(function(d){ return (Math.random() * 2 - 1) * velocityMultiplier; });
        return new Particle(position, velocity, pso.inertiaWeight, pso.social, pso.personal);
    }
    
    function init(generationOption) {          
        this.iteration = 0;
        bestPositionEver = null;
        bestFitnessEver = -Infinity;
        
        var generator = generationOption instanceof Function ?
            function() { return geneationOption(); } :
            function() { return createRandom(generationOption, this); }.bind(this);
        
        particles = [];
        for (var i = 0; i < this.nParticles; i++) {
            particles.push(generator());
        }
    }

    function getRandomBest(except) {
        var ret = (Math.random() * particles.length) | 0;
        
        particles.forEach(function(particle, index) {
            if (Math.random() < pressure &&
                particles[index].fitness > particles[ret].fitness && 
                index !== except) {
                ret = index;
            }
        });
        
        return ret;
    }

    function step() {
        particles.forEach(function(particle) {     
            particle.fitness = this.objectiveFunction(particle.position);
            
            if(particle.fitness > particle.bestFitness) {
                particle.bestFitness = particle.fitness;
                particle.storePosition();
    
                if(particle.fitness > bestFitnessEver) {
                    bestFitnessEver = particle.fitness;
                    bestPositionEver = particle.getPosition();
                }
            }
        }.bind(this));
     
        // update velocities
        particles.forEach(function(particle, index) {
            var randomBest = particles[getRandomBest(index)];
            particle.updateVelocity(randomBest);
        });
            
        // update positions
        particles.forEach(function(particle, index) {
            particle.updatePosition();
        });
        
        this.iteration++;
    }

    function getParticles() {
        return particles.map(function(particle) {
            return particle.getPosition();
        });
    }
    
    function getParticlesBest() {
        return particles.map(function(particle) {
            return particle.getBestPosition();
        });
    }

    function getBestPosition() {
        return bestPositionEver;
    }

    function getMeanFitness() {
        var sum = 0;
        particles.forEach(function(particle) {
            sum += particle.fitness;
        });
        return sum / particles.length;
    }
};
