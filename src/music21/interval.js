/**
 * music21j -- Javascript reimplementation of Core music21p features.  
 * music21/interval -- Interval routines
 *
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006-14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['./prebase', './pitch'],
        /**
         * interval module. See {@link music21.interval} for namespace
         * 
         * @exports music21/interval
         */
        function(prebase, pitch) {
    /**
     * Interval related objects
     * 
     * @namespace music21.interval
     * @memberof music21
     * @requires music21/prebase
     * @requires music21/pitch
     */
	var interval = {};

	/**
	 * Interval Directions as an Object/map
	 * 
	 * @memberof music21.interval
	 * @example
	 * if (music21.interval.IntervalDirections.OBLIQUE >
	 *     music21.interval.IntervalDirections.ASCENDING ) {
	 *    console.log(music21.interval.IntervalDirections.DESCENDING);    
	 * }
	 * 
	 */
	interval.IntervalDirections = {
		DESCENDING: -1,
		OBLIQUE: 0,
		ASCENDING: 1
	};

	/**
	 * N.B. a dict in music21p -- the indexes here let IntervalDirections call them + 1
	 * 
	 * @memberof music21.interval
	 * @example
	 * console.log(music21.interval.IntervalDirectionTerms[music21l.interval.IntervalDirections.OBLIQUE + 1])
	 * // "Oblique" 
	 */
	interval.IntervalDirectionTerms = ['Descending', 'Oblique','Ascending'];

	/**
	 * ordinals for music terms...
	 * 
	 * @memberof music21.interval
	 * @example
	 * for (var i = 1; // N.B. 0 = undefined
	 *      i < music21.interval.MusicOrdinals.length;
	 *      i++) {
	 *     console.log(i, music21.interval.MusicOrdinals[i]);
	 * }
	 * // 1, Unison
	 * // 2, Second
	 * // 3, Third
	 * // ...
	 * // 8, Octave
	 * // ...
	 * // 15, Double Octave
	 */
	interval.MusicOrdinals = [undefined, 'Unison', 'Second', 'Third', 'Fourth',
							 'Fifth', 'Sixth', 'Seventh', 'Octave',
							 'Ninth', 'Tenth', 'Eleventh', 'Twelfth',
							 'Thirteenth', 'Fourteenth', 'Double Octave'];
							 
	/**
	 * Represents an interval such as unison, second, etc.
	 * 
	 * Properties are demonstrated below.
	 * 
	 * @class GenericInterval
	 * @memberof music21.interval
	 * @param {Int} [gi=1] - generic interval (1 or higher, or -2 or lower)
	 * @example
	 * var gi = new music21.interval.GenericInterval(-14)
	 * gi.value
	 * // -14
	 * gi.directed
	 * // -14
	 * gi.undirected
	 * // 14
	 * gi.direction == music21.interval.IntervalDirections.DESCENDING
	 * // true
	 * gi.isSkip
	 * // true
	 * gi.isStep
	 * // false
	 * gi.isDiatonicStep
	 * // false  // augmented unisons are not diatonicSteps but can't tell yet..
	 * gi.isUnison
	 * // false
	 * gi.simpleUndirected
	 * // 7
	 * gi.undirectedOctaves
	 * // 1
	 * gi.semiSimpleUndirected
	 * // 7  -- semiSimple distinguishes between 8 and 1; that's all
	 * gi.perfectable
	 * // false
	 * gi.niceName
	 * // "Fourteenth"
	 * gi.directedNiceName
	 * // "Descending Fourteenth"
	 * gi.simpleNiceName
	 * // "Seventh"
	 * gi.staffDistance
	 * // -13
	 * gi.mod7inversion
	 * // 2  // sevenths invert to seconds
	 * 
	 */
	interval.GenericInterval = function (gi) {
	    prebase.ProtoM21Object.call(this);
		this.classes.push('GenericInterval');
		if (gi === undefined) {
			gi = 1;
		}
		this.value = gi; // todo: convertGeneric() from python
		this.directed =	this.value;
		this.undirected = Math.abs(this.value);
		
		if (this.directed == 1) { this.direction = interval.IntervalDirections.OBLIQUE; }
		else if (this.directed < 0) { this.direction = interval.IntervalDirections.DESCENDING; }
		else if (this.directed > 1) { this.direction = interval.IntervalDirections.ASCENDING; }
		// else (raise exception)
		
		if (this.undirected > 2) { this.isSkip = true; }
		else { this.isSkip = false; }
		
		if (this.undirected == 2) { this.isDiatonicStep = true; }
		else { this.isDiatonicStep = false; }
		
		this.isStep = this.isDiatonicStep;
		
		if (this.undirected == 1) { this.isUnison = true; }
		else { this.isUnison = false; }
		
		var tempSteps = this.undirected % 7;
		var tempOctaves = parseInt(this.undirected / 7);
		if (tempSteps === 0) {
			tempOctaves -= 1;
			tempSteps = 7;
		}
		this.simpleUndirected = tempSteps;
		this.undirectedOctaves = tempOctaves;
		if ((tempSteps == 1) && (tempOctaves >= 1)) {
			this.semiSimpleUndirected = 8;
		} else {
			this.semiSimpleUndirected = this.simpleUndirected;
		}
		
		if (this.direction == interval.IntervalDirections.DESCENDING) {
			this.octaves = -1 * tempOctaves;
			if (tempSteps != 1) {
				this.simpleDirected = -1 * tempSteps;
			} else {
				this.simpleDirected = 1;  // no descending unisons...
			}
			this.semiSimpleDirected = -1 * this.semiSimpleUndirected;
		} else {
			this.octaves = tempOctaves;
			this.simpleDirected = tempSteps;
			this.semiSimpleDirected = this.semiSimpleUndirected;
		}
		if ((this.simpleUndirected==1) ||
			   (this.simpleUndirected==4) ||
			   (this.simpleUndirected==5)) {
			this.perfectable = true;
		} else {
			this.perfectable = false;
		}

		if (this.undirected < interval.MusicOrdinals.length) {
			this.niceName = interval.MusicOrdinals[this.undirected];
		} else {
			this.niceName = this.undirected.toString();
		}
		
		this.simpleNiceName = interval.MusicOrdinals[this.simpleUndirected];
		this.semiSimpleNiceName = interval.MusicOrdinals[this.semiSimpleUndirected];
		

		if (Math.abs(this.directed) == 1) {
			this.staffDistance = 0;
		} else if (this.directed > 1) {
			this.staffDistance = this.directed - 1;
		} else if (this.directed < -1) {
			this.staffDistance = this.directed + 1;
		} 
		// else: raise IntervalException("Non-integer, -1, or 0 not permitted as a diatonic interval")

		// 2 -> 7; 3 -> 6; 8 -> 1 etc.
		this.mod7inversion = 9 - this.semiSimpleUndirected ;

		if (this.direction == interval.IntervalDirections.DESCENDING) {
			this.mod7 = this.mod7inversion;  // see chord.semitonesFromChordStep for usage...
		} else {
			this.mod7 = this.simpleDirected;
		}		
	};
    interval.GenericInterval.prototype = new prebase.ProtoM21Object();
    interval.GenericInterval.prototype.constructor = interval.GenericInterval;
    
    /**
     * Returns a new GenericInterval which is the mod7inversion; 3rds (and 10ths etc.) to 6ths, etc.
     * 
     * @memberof music21.interval.GenericInterval
     * @returns {music21.interval.GenericInterval}
     */
    interval.GenericInterval.prototype.complement = function () {
        return new interval.GenericInterval(this.mod7inversion);
    };
    
    /**
     * Returns a new GenericInterval which has the opposite direction (descending becomes ascending, etc.)
     * 
     * @memberof music21.interval.GenericInterval
     * @returns {music21.interval.GenericInterval}
     */
    interval.GenericInterval.prototype.reverse = function () {
        if (this.undirected == 1) {
            return new interval.GenericInterval(1);
        } else {
            return new interval.GenericInterval(this.undirected * (-1 * this.direction));
        }
    };
    /**
     * Given a specifier, return a new DiatonicInterval with this generic.
     * 
     * @memberof music21.interval.GenericInterval
     * @param {string|Int} specifier - a specifier such as "P","m","M","A","dd" etc.
     * @returns {music21.interval.DiatonicInterval}
     */
    interval.GenericInterval.prototype.getDiatonic = function (specifier) {
        return new interval.DiatonicInterval(specifier, this);
    };  

    /**
     * Transpose a pitch by this generic interval, maintaining accidentals
     * 
     * @memberof music21.interval.GenericInterval
     * @param {music21.pitch.Pitch} p
     * @returns {music21.pitch.Pitch}
     */
    interval.GenericInterval.prototype.transposePitch = function (p) {
        var pitch2 = new pitch.Pitch();
        pitch2.step = p.step;
        pitch2.octave = p.octave;
        
        var oldDiatonicNum = p.diatonicNoteNum;
        
        var distanceToMove = this.staffDistance;

        // if not reverse...
        var newDiatonicNumber = oldDiatonicNum + distanceToMove;
        var newInfo = interval.IntervalConvertDiatonicNumberToStep(newDiatonicNumber);
        pitch2.step = newInfo[0];
        pitch2.octave = newInfo[1];
        if (p.accidental !== undefined) {
            pitch2.accidental = new music21.pitch.Accidental(p.accidental.name);            
        }
        return pitch2;
    };
    
	interval.IntervalSpecifiersEnum = { 
		PERFECT:    1,
		MAJOR:      2,
		MINOR:      3,
		AUGMENTED:  4,
		DIMINISHED: 5,
		DBLAUG:     6,
		DBLDIM:     7,
		TRPAUG:     8,
		TRPDIM:     9,
		QUADAUG:   10,
		QUADDIM:   11
	};

	interval.IntervalNiceSpecNames = [
		'ERROR', 'Perfect', 'Major', 'Minor', 
		'Augmented', 'Diminished', 'Doubly-Augmented', 'Doubly-Diminished', 
		'Triply-Augmented', 'Triply-Diminished', "Quadruply-Augmented", "Quadruply-Diminished"
	];
	interval.IntervalPrefixSpecs = [
		undefined, 'P', 'M', 'm', 'A', 'd', 'AA', 'dd', 'AAA', 'ddd', 'AAAA', 'dddd'
	];



	interval.IntervalOrderedPerfSpecs = [
		'dddd', 'ddd', 'dd', 'd', 'P', 'A', 'AA', 'AAA', 'AAAA'
	];

	interval.IntervalPerfSpecifiers = [
		interval.IntervalSpecifiersEnum.QUADDMIN,
		interval.IntervalSpecifiersEnum.TRPDIM,
		interval.IntervalSpecifiersEnum.DBLDIM,
		interval.IntervalSpecifiersEnum.DIMINISHED,
		interval.IntervalSpecifiersEnum.PERFECT,
		interval.IntervalSpecifiersEnum.AUGMENTED,
		interval.IntervalSpecifiersEnum.DBLAUG,
		interval.IntervalSpecifiersEnum.TRPAUG,
		interval.IntervalSpecifiersEnum.QUADAUG
	];
	interval.IntervalPerfOffset = 4;

	interval.IntervalOrderedImperfSpecs = [
		'dddd', 'ddd', 'dd', 'd', 'm', 'M', 'A', 'AA', 'AAA', 'AAAA'
	];

	interval.IntervalSpecifiers = [
		interval.IntervalSpecifiersEnum.QUADDMIN,
		interval.IntervalSpecifiersEnum.TRPDIM,
		interval.IntervalSpecifiersEnum.DBLDIM,
		interval.IntervalSpecifiersEnum.DIMINISHED,
		interval.IntervalSpecifiersEnum.MINOR,
		interval.IntervalSpecifiersEnum.MAJOR,
		interval.IntervalSpecifiersEnum.AUGMENTED,
		interval.IntervalSpecifiersEnum.DBLAUG,
		interval.IntervalSpecifiersEnum.TRPAUG,
		interval.IntervalSpecifiersEnum.QUADAUG
	];
	interval.IntervalMajOffset = 5;

	interval.IntervalSemitonesGeneric = {
		1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11
	};
	interval.IntervalAdjustPerfect = {
		"P": 0, "A": 1, "AA": 2, "AAA": 3, "AAAA": 4,
		"d": -1, "dd": -2, "ddd": -3, "dddd": -4
	}; // offset from Perfect

	interval.IntervalAdjustImperf = {
		"M": 0, "m": -1, "A": 1, "AA": 2, "AAA": 3, "AAAA": 4,
		"d": -2, "dd": -3, "ddd": -4, "dddd": -5
	}; // offset from major


	/**
	 * Represents a Diatonic interval.  See example for usage.
	 * 
     * @class DiatonicInterval
     * @memberof music21.interval
     * @param {string|Int|undefined} [specifier='P'] - a specifier such as "P", "d", "m", "M" etc.
     * @param {music21.interval.GenericInterval|Int} [generic=1] - a `GenericInterval` object or a number to be converted to one
     * @example
     * var di = new music21.interval.DiatonicInterval("M", 10);
     * di.generic.isClassOrSubclass('GenericInterval');
     * // true
     * di.specifier;
     * // 'M'
     * di.name;
     * // 'M10'
     * di.direction == music21.interval.IntervalDirections.ASCENDING;
     * // true
     * di.niceName
     * // "Major Tenth"
     * 
     * // See music21p for more possibilities.
	 */
	interval.DiatonicInterval = function (specifier, generic) {
        prebase.ProtoM21Object.call(this);
	    this.classes.push('DiatonicInterval');

		if (specifier === undefined) {
			specifier = "P";
		}
		if (generic === undefined) {
			generic = new interval.GenericInterval(1);
		} else if (typeof generic == 'number') {
		    generic = new interval.GenericInterval(generic);
		}
		
		this.name = "";
		if (typeof specifier == 'number') {
		    this.specifier = specifier;
		} else {
	        this.specifier = interval.IntervalPrefixSpecs.indexOf(specifier); // todo: convertSpecifier();		    
		}
		this.generic = generic;
		
		if ((generic.undirected != 1) || (specifier == interval.IntervalSpecifiersEnum.PERFECT)) {
			this.direction = generic.direction;
		} else {
			// diminished unisons -- very controversial
			if (interval.IntervalPerfSpecifiers.indexOf(specifier) <= interval.IntervalPerfSpecifiers.indexOf(interval.IntervalSpecifiersEnum.DIMINISHED)) {
				this.direction = interval.IntervalDirections.DESCENDING;
			} else {
				this.direction = interval.IntervalDirections.ASCENDING;
			}
		}
		var diatonicDirectionNiceName = interval.IntervalDirectionTerms[this.direction + 1];
		this.name = interval.IntervalPrefixSpecs[this.specifier] + generic.undirected.toString();
		this.niceName = interval.IntervalNiceSpecNames[this.specifier] + " " + generic.niceName;
		this.simpleName = interval.IntervalPrefixSpecs[this.specifier] + generic.simpleUndirected.toString();
		this.simpleNiceName = interval.IntervalNiceSpecNames[this.specifier] + " " + generic.simpleNiceName;
		this.semiSimpleName = interval.IntervalPrefixSpecs[this.specifier] + generic.semiSimpleUndirected.toString();
		this.semiSimpleNiceName = interval.IntervalNiceSpecNames[this.specifier] + " " + generic.semiSimpleNiceName;
		this.directedName = interval.IntervalPrefixSpecs[this.specifier] + generic.directed.toString();
		this.directedNiceName = diatonicDirectionNiceName + " " + this.niceName;
		this.directedSimpleName = interval.IntervalPrefixSpecs[this.specifier] + generic.simpleDirected.toString();
		this.directedSimpleNiceName = diatonicDirectionNiceName + " " + this.simpleNiceName;
		this.directedSemiSimpleName = interval.IntervalPrefixSpecs[this.specifier] + generic.semiSimpleDirected.toString();
		this.directedSemiSimpleNiceName = diatonicDirectionNiceName + " " + this.semiSimpleNameName;
		this.specificName = interval.IntervalNiceSpecNames[this.specifier];
		this.perfectable = generic.perfectable;
		this.isDiatonicStep = generic.isDiatonicStep;
		this.isStep = generic.isStep;
		
		// generate inversions
		if (this.perfectable) {
			this.orderedSpecifierIndex = interval.IntervalOrderedPerfSpecs.indexOf(interval.IntervalPrefixSpecs[this.specifier]);
			this.invertedOrderedSpecIndex = (interval.IntervalOrderedPerfSpecs.length - 1 - this.orderedSpecifierIndex);
			this.invertedOrderedSpecifier = interval.IntervalOrderedPerfSpecs[this.invertedOrderedSpecIndex];
		} else {
			this.orderedSpecifierIndex = interval.IntervalOrderedImperfSpecs.indexOf(interval.IntervalPrefixSpecs[this.specifier]);
			this.invertedOrderedSpecIndex = (interval.IntervalOrderedImperfSpecs.length - 1 - this.orderedSpecifierIndex);
			this.invertedOrderedSpecifier = interval.IntervalOrderedImperfSpecs[this.invertedOrderedSpecIndex];
		}

		this.mod7inversion = this.invertedOrderedSpecifier + generic.mod7inversion.toString();
		/* ( if (this.direction == interval.IntervalDirections.DESCENDING) {
			this.mod7 = this.mod7inversion;
		} else {
			this.mod7 = this.simpleName;
		} */

		// TODO: reverse()
		// TODO: property cents
		
		
	};
    interval.DiatonicInterval.prototype = new prebase.ProtoM21Object();
    interval.DiatonicInterval.prototype.constructor = interval.DiatonicInterval;

    /**
     * Returns a ChromaticInterval object of the same size.
     * 
     * @memberof music21.interval.DiatonicInterval
     * @returns {music21.interval.ChromaticInterval}
     */
    interval.DiatonicInterval.prototype.getChromatic = function () {
        var octaveOffset = Math.floor(Math.abs(this.generic.staffDistance)/7);
        var semitonesStart = interval.IntervalSemitonesGeneric[this.generic.simpleUndirected];
        var specName = interval.IntervalPrefixSpecs[this.specifier];
        
        var semitonesAdjust = 0;
        if (this.generic.perfectable) {
            semitonesAdjust = interval.IntervalAdjustPerfect[specName];
        } else {
            semitonesAdjust = interval.IntervalAdjustImperf[specName];
        }

        var semitones = (octaveOffset * 12) + semitonesStart + semitonesAdjust;
        

        // direction should be same as original
        
        if (this.generic.direction == interval.IntervalDirections.DESCENDING) {
            semitones *= -1;    
        }
        if (music21.debug) {
            console.log('DiatonicInterval.getChromatic -- octaveOffset: ' + octaveOffset);
            console.log('DiatonicInterval.getChromatic -- semitonesStart: ' + semitonesStart);
            console.log('DiatonicInterval.getChromatic -- specName: ' + specName);
            console.log('DiatonicInterval.getChromatic -- semitonesAdjust: ' + semitonesAdjust);
            console.log('DiatonicInterval.getChromatic -- semitones: ' + semitones);
        }
        return new interval.ChromaticInterval(semitones);
    };

    /**
     * @class ChromaticInterval
     * @memberof music21.interval
     * @param {number} value - number of semitones (positive or negative)
     * @property {number} cents
     * @property {number} value
     * @property {number} undirected - absolute value of value
     * @property {number} mod12 - reduction to one octave
     * @property {number} intervalClass - reduction to within a tritone (11 = 1, etc.)
     * 
     */
    interval.ChromaticInterval = function (value) {
        prebase.ProtoM21Object.call(this);
        this.classes.push('ChromaticInterval');
		
		this.semitones = value;
		this.cents = Math.round(value * 100.0, 5);
		this.directed = value;
		this.undirected = Math.abs(value);
		
		if (this.directed === 0) {
			this.direction = interval.IntervalDirections.OBLIQUE;
		} else if (this.directed == this.undirected) {
			this.direction = interval.IntervalDirections.ASCENDING;	
		} else {
			this.direction = interval.IntervalDirections.DESCENDING;
		}

		this.mod12 = this.semitones % 12;
		this.simpleUndirected = this.undirected % 12;
		if (this.direction == interval.IntervalDirections.DESCENDING) {
			this.simpleDirected = -1 * this.simpleUndirected;
		} else {
			this.simpleDirected = this.simpleUndirected;
		}
		
		this.intervalClass = this.mod12;
		if (this.mod12 > 6) { 
			this.intervalClass = 12 - this.mod12;
		}

		if (this.undirected == 1) {
			this.isChromaticStep = true;
		} else {
			this.isChromaticStep = false;
		}
		
	};
    interval.ChromaticInterval.prototype = new prebase.ProtoM21Object();
    interval.ChromaticInterval.prototype.constructor = interval.ChromaticInterval;

    interval.ChromaticInterval.prototype.reverse = function () {
        return new interval.ChromaticInterval(this.undirected * (-1 * this.direction));
    };
    
    // TODO: this.getDiatonic()
    
    /**
     * Transposes pitches but does not maintain accidentals, etc.
     * 
     * @memberof music21.interval.ChromaticInterval
     * @property {music21.pitch.Pitch} p - pitch to transpose
     * @returns {music21.pitch.Pitch}
     */
    interval.ChromaticInterval.prototype.transposePitch = function (p) {
        var useImplicitOctave = false;
        if (p.octave === undefined) {
            // not yet implemented in m21j
            useImplicitOctave = true;
        }
        var pps = p.ps;
        newPitch = new pitch.Pitch();
        newPitch.ps = pps + this.semitones;
        if (useImplicitOctave) {
            newPitch.octave = undefined;
        }
        return newPitch;
    };

    
    
	interval.IntervalStepNames = ['C','D','E','F','G','A','B'];

	/**
	 * @function music21.interval.IntervalConvertDiatonicNumberToStep
	 * @memberof music21.interval
	 * @param {Int} dn - diatonic number, where 29 = C4, C#4 etc.
	 * @returns {Array} two element array of {string} stepName and {Int} octave
	 */
	interval.IntervalConvertDiatonicNumberToStep = function (dn) {
		var stepNumber;
		var octave;
		if (dn === 0) {
			return ["B", -1];
		} else if (dn > 0) {
			octave = Math.floor( (dn-1) / 7 );
			stepNumber = (dn - 1) - (octave * 7);
		} else { // low notes... test, because js(floor) != py(int);
			octave = Math.floor(dn/7);
			stepNumber = (dn - 1) - ( (octave + 1) * 7);
		}
		var stepName = interval.IntervalStepNames[stepNumber];
		return [stepName, octave];
	};

	
	/**
	 * This is the main, powerful Interval class.
	 * 
	 * Instantiate with either a string ("M3") or two {@link music21.pitch.Pitch} or two {@link music21.note.Note}
	 * 
	 * See music21p instructions for usage.
	 * 
	 * @class Interval
	 * @memberof music21.interval
	 * @example
	 * var n1 = new music21.note.Note("C4");
	 * var n2 = new music21.note.Note("F#5");
	 * var iv = new music21.interval.Interval(n1, n2);
	 * iv.isConsonant();
	 * // false
	 * iv.semitones;
	 * // 18
	 * iv.niceName
	 * // "Augmented Eleventh"
	 */
	interval.Interval = function () {
        prebase.ProtoM21Object.call(this);
        this.classes.push('Interval');

		// todo: allow full range of ways of specifying as in m21p
		if (arguments.length == 1) {
			var arg0 = arguments[0];
			if (typeof(arg0) == 'string') {
				// simple...
				var specifier = arg0.slice(0,1);
				var generic = parseInt(arg0.slice(1));
				var gI = new interval.GenericInterval(generic);
				var dI = new interval.DiatonicInterval(specifier, gI);
				this.diatonic = dI;
				this.chromatic = this.diatonic.getChromatic();			
			} else if (arg0.specifier !== undefined) {
				// assume diatonic...
				this.diatonic = arg0;
				this.chromatic = this.diatonic.getChromatic();
			} else {
				console.error('cant parse string arguments to Interval yet');
			}
		} else if (arguments.length == 2) {
		    if (arguments[0].pitch === undefined && arguments[0].diatonicNoteNum === undefined) {
	            this.diatonic = arguments[0];
	            this.chromatic = arguments[1];
	        } else {
	            var n1 = arguments[0];
	            var n2 = arguments[1];
	            var gInt = interval.notesToGeneric(n1, n2);
	            var cInt = interval.notesToChromatic(n1, n2);
	            
	            this.diatonic = interval.intervalsToDiatonic(gInt, cInt);
	            this.chromatic = cInt;
	        }
		}  
		this.reinit();
		Object.defineProperties(this, {
		    'complement': {
		        enumerable: true,
		        get: function () {
		            return new interval.Interval(this.diatonic.mod7inversion);
		        }
		    }
		});
	};
    interval.Interval.prototype = new prebase.ProtoM21Object();
    interval.Interval.prototype.constructor = interval.Interval;
    
    interval.Interval.prototype.reinit = function () {
        this.direction = this.chromatic.direction;
        this.specifier = this.diatonic.specifier;
        this.diatonicType = this.diatonic.specifier;
        //this.specificName = this.diatonic.specificName;
        this.generic = this.diatonic.generic;
        
        this.name = this.diatonic.name;
        this.niceName = this.diatonic.niceName;
        this.simpleName = this.diatonic.simpleName;
        this.simpleNiceName = this.diatonic.simpleNiceName;
        this.semiSimpleName = this.diatonic.semiSimpleName;
        this.semiSimpleNiceName = this.diatonic.semiSimpleNiceName;
        
        this.directedName = this.diatonic.directedName;
        this.directedNiceName = this.diatonic.directedNiceName;
        this.directedSimpleName = this.diatonic.directedSimpleName;
        this.directedSimpleNiceName = this.diatonic.directedSimpleNiceName;
        
        // other names...
        this.isDiatonicStep = this.diatonic.isDiatonicStep;
        
        this.isChromaticStep = this.chromatic.isChromaticStep;
        this.semitones = this.chromatic.semitones;
        this.intervalClass = this.chromatic.intervalClass;
        this.cents = this.chromatic.cents;
        this.isStep = (this.isChromaticStep || this.isDiatonicStep);
    };

    /**
     * @memberof music21.interval.Interval
     * @returns {Boolean}
     */
    interval.Interval.prototype.isConsonant = function () {
        var sn = this.simpleName;
        if (sn == 'P5' || sn == 'm3' || sn == 'M3' || 
                sn == 'm6' || sn == 'M6' || sn == 'P1') {
            return true;
        } else {
            return false;
        }
    };

    // todo general: microtones
    /**
     * @memberof music21.interval.Interval
     * @param {music21.pitch.Pitch} p - pitch to transpose
     * @returns {music21.pitch.Pitch}
     */
    interval.Interval.prototype.transposePitch = function (p) {
        // todo: reverse, clearAccidentalDisplay, maxAccidental;
        
        /*
        var useImplicitOctave = false;
        if (p.octave === undefined) {
            useImplicitOctave = true;
        }
        */
        var pitch2 = this.diatonic.generic.transposePitch(p);
        pitch2.accidental = undefined;
        // step and octave are right now, but not necessarily accidental
        var halfStepsToFix = this.chromatic.semitones - parseInt(pitch2.ps - p.ps);
        if (halfStepsToFix !== 0) {
            pitch2.accidental = new pitch.Accidental(halfStepsToFix);
        }
        if (music21.debug) {
            console.log('Interval.transposePitch -- distance to move' + distanceToMove);
            console.log('Interval.transposePitch -- old diatonic num' + oldDiatonicNum);
            console.log("Interval.transposePitch -- new step " + pitch2.step);
            console.log("Interval.transposePitch -- new diatonic number " + newDiatonicNumber);
            console.log("Interval.transposePitch -- new octave " + pitch2.octave);
            console.log("Interval.transposePitch -- fixing halfsteps for " + halfStepsToFix);
        }
        return pitch2;
    };

    /**
     * Convert two notes or pitches to a GenericInterval;
     */
    interval.notesToGeneric = function (n1, n2) {
        var p1 = n1;
        if (n1.pitch !== undefined) {
            p1 = n1.pitch;
        }
        var p2 = n2;
        if (n2.pitch !== undefined) {
            p2 = n2.pitch;
        }
        var staffDist = p2.diatonicNoteNum - p1.diatonicNoteNum;
        var genDist = interval.convertStaffDistanceToInterval(staffDist);
        return new interval.GenericInterval(genDist);
    };
    
    interval.convertStaffDistanceToInterval = function(staffDist) {
        if (staffDist === 0) {
            return 1;
        } else if (staffDist > 0) {
            return staffDist + 1;
        } else {
            return staffDist - 1;
        }
    };
    
    interval.notesToChromatic = function (n1, n2) {
        var p1 = n1;
        if (n1.pitch !== undefined) {
            p1 = n1.pitch;
        }
        var p2 = n2;
        if (n2.pitch !== undefined) {
            p2 = n2.pitch;
        }
        return new interval.ChromaticInterval(p2.ps - p1.ps);
    };
    
    interval.intervalsToDiatonic = function(gInt, cInt) {
        var specifier = interval._getSpecifierFromGenericChromatic(gInt, cInt);
        // todo -- convert specifier...
        return new interval.DiatonicInterval(specifier, gInt);
    };
    
    interval._getSpecifierFromGenericChromatic = function(gInt, cInt) {        
        var noteVals = [undefined, 0, 2, 4, 5, 7, 9, 11];
        var normalSemis = noteVals[gInt.simpleUndirected] + 12 * gInt.undirectedOctaves;
        var theseSemis = 0;
        if (    gInt.direction != cInt.direction && 
                gInt.direction != interval.IntervalDirections.OBLIQUE && 
                cInt.direction != interval.IntervalDirections.OBLIQUE) {
            // intervals like d2 and dd2 etc. (the last test doesn't matter, since -1*0 === 0, but in theory it should be there)
            theseSemis = -1 * cInt.undirected;            
        } else if (gInt.undirected == 1) {
            theseSemis = cInt.directed; // matters for unison            
        } else {
            // all normal intervals
            theseSemis  = cInt.undirected;          
        }
        var semisRounded = Math.round(theseSemis);
        var specifier = "";
        if (gInt.perfectable) {
            specifier = interval.IntervalPerfSpecifiers[interval.IntervalPerfOffset + semisRounded - normalSemis];
        } else {
            specifier = interval.IntervalSpecifiers[interval.IntervalMajOffset + semisRounded - normalSemis];
        }
        return specifier;
    };
    
	// end of define
	if (typeof(music21) != "undefined") {
		music21.interval = interval;
	}		
	return interval;
});