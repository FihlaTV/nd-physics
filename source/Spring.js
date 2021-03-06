/**
 * Spring constructor.
 * Creates a constraint between 2 particles.
 * @constructor
 * @param {Particle} p1 Particle to constrain to p2.
 * @param {Particle} p2 Particle to constrain to p1.
 * @param {Number} length Rest length of the spring.
 * @param {Number} stiffness Stiffness of the spring where 0 is elastic and 1 is rigid.
 */
NDP.Spring = function(p1, p2, length, stiffness) {

  // Validate p1 argument.
  if (!NDP.isType(p1, NDP.Particle)) {
    throw 'Spring: p1 must be a Particle instance ['+p1+']';
  }

  // Validate p2 argument.
  if (!NDP.isType(p2, NDP.Particle)) {
    throw 'Spring: p2 must be a Particle instance ['+p2+']';
  }

  // Validate particle dimension compatibility.
  if (p1 === p2) {
    throw 'Spring: p1 and p2 cannot be the same Particle instance';
  }

  // Validate particle dimension compatibility.
  if (p1.dimensions !== p2.dimensions) {
    throw 'Spring: Particles must have equal dimensions. p1.dimensions['+p1.dimensions+'] p2.dimensions['+p2.dimensions+']';
  }

  // Validate length argument.
  if (!NDP.isNumber(length)) {
    throw 'Spring: length must be a Number ['+length+']';
  }

  // Validate stiffness argument.
  if (!NDP.isNumber(stiffness)) {
    throw 'Spring: stiffness must be a Number ['+stiffness+']';
  }

  /**
   * Unique identifier.
   * @type {Number}
   */
  Object.defineProperty(this, 'id', {
    value: this.constructor.__uid++
  });

  // Set properties.
  this.p1 = p1;
  this.p2 = p2;
  this.length = length;
  this.stiffness = stiffness;

  // Set vector object.
  this.__vector = p1.__vector;

  // Create spring worker vectors.
  this.__delta = this.__vector.create();
  this.__slave = this.__vector.create();
};

/**
 * Spring unique identifier counter.
 * @type {Number}
 */
NDP.Spring.__uid = 0;

/**
 * Particle 1.
 * @type {Particle}
 */
Object.defineProperty(NDP.Spring.prototype, 'p1', {
  set: function(value) {
    if (NDP.isType(value, NDP.Particle)) {
      this.__p1 = value;
    }
  },
  get: function() {
    return this.__p1;
  }
});

/**
 * Particle 2.
 * @type {Particle}
 */
Object.defineProperty(NDP.Spring.prototype, 'p2', {
  set: function(value) {
    if (NDP.isType(value, NDP.Particle)) {
      this.__p2 = value;
    }
  },
  get: function() {
    return this.__p2;
  }
});

/**
 * Rest length of the spring.
 * @type {Number}
 */
Object.defineProperty(NDP.Spring.prototype, 'length', {
  set: function(value) {
    if (NDP.isNumber(value)) {
      this.__length = value;
    }
  },
  get: function() {
    return this.__length;
  }
});

/**
 * Stiffness of the spring where 0 is elastic and 1 is rigid.
 * @type {Number}
 */
Object.defineProperty(NDP.Spring.prototype, 'stiffness', {
  set: function(value) {
    if (NDP.isNumber(value)) {
      this.__stiffness = value;
    }
  },
  get: function() {
    return this.__stiffness;
  }
});

/**
 * Updates the positions of the two particles attached to the spring.
 * Hooke's Law
 * F = -k * e
 * F = Force in newtons [N]
 * k = Spring constant in newtons per metre [N/m]
 * e = Extension beyond rest length in metres [m]
 * @param {Number} delta Time delta since last integration.
 * @param {Number} index Index of the spring within the system.
 * @return {Spring} Spring instance for chaining.
 */
NDP.Spring.prototype.update = function(delta, index) {

  // Calculate delta between the two particles.
  this.__vector.subtract(this.__delta, this.__p2.__pos, this.__p1.__pos);

  // Calculate force.
  var inverseMass = this.__p1.__inverseMass + this.__p2.__inverseMass;
  var distance = NDP.__THRESHOLD + this.__vector.length(this.__delta);
  var extension = distance - this.__length;
  // var force = extension * this.__stiffness;
  var force = extension / (distance * inverseMass) * this.__stiffness;

  // Apply force to particles.
  this.apply(this.__p1, force);
  this.apply(this.__p2,-force);

  return this;
};

/**
 * Applies spring force to a particle.
 * @param {Particle} particle Particle to apply force to.
 * @param {Number} force Force to apply to the particle.
 * @return {Spring} Spring instance for chaining.
 */
NDP.Spring.prototype.apply = function(particle, force) {
  if (!particle.__fixed) {
    this.__vector.scale(this.__slave, this.__delta, particle.__inverseMass * force);
    this.__vector.add(particle.__pos, particle.__pos, this.__slave);
  }
  return this;
};
