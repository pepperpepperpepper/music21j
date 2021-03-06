/**
 * music21j -- Javascript reimplementation of Core music21p features.  
 * music21/roman -- roman.RomanNumberal -- Chord subclass
 *
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['./chord', './key', './pitch', './interval'], 
        /**
         * Roman numeral module. See {@link music21.roman} namespace
         * 
         * @exports music21/roman
         */
        function(chord, key, pitch, interval) {
    /**
     * music21.roman -- namespace for dealing with RomanNumeral analysis.
     * 
     * @namespace music21.roman
     * @memberof music21
     * @requires music21/chord
     * @requires music21/key
     * @requires music21/pitch
     * @requires music21/interval
     */
    var roman = {};

    /**
     * maps an index number to a roman numeral in lowercase 
     * 
     * @memberof music21.roman
     * @example
     * music21.roman.romanToNumber[4]
     * // 'iv'
     */
	roman.romanToNumber = [undefined, 'i','ii','iii','iv','v','vi','vii'];

	/**
	 * Represents a RomanNumeral.  By default, capital Roman Numerals are
	 * major chords; lowercase are minor.
	 * 
	 * see music21p's roman module for better instructions.
	 * 
     * current limitations:
     * 
     * no inversions
     * no numeric figures except 7
     * no d7 = dominant 7
     * no frontAlterationAccidentals
     * no secondary dominants
     * no Aug6th chords
	 * 
	 * @class RomanNumeral
	 * @memberof music21.roman
	 * @extends music21.chord.Chord
	 * @param {string} figure - the roman numeral as a string, e.g., 'IV', 'viio', 'V7'
	 * @param {string|music21.key.Key} [keyStr='C']
	 * @property {Array<music21.pitch.Pitch>} scale - (readonly) returns the scale associated with the roman numeral
	 * @property {music21.key.Key} key - the key associated with the RomanNumeral (not allowed to be undefined yet)
	 * @property {string} figure - the figure as passed in
	 * @property {string} degreeName - the name associated with the scale degree, such as "mediant" etc., scale 7 will be "leading tone" or "subtonic" appropriately
	 * @property {Int} scaleDegree
	 * @property {string} impliedQuality - "major", "minor", "diminished", "augmented"
	 * @property {Array<music21.pitch.Pitch>} pitches - RomanNumerals are Chord objects, so .pitches will work for them also.
	 */
	roman.RomanNumeral = function (figure, keyStr) {
		this.figure = figure;
		this._scale = undefined;
		this._key = undefined;
		chord.Chord.call(this);
		this.classes.push('RomanNumeral');
		
	    Object.defineProperties(this, {
	    	'scale': {
	    	    enumerable: true,
	    		get: function () {
	    			if (this._scale != undefined) {
	    				return this._scale;
	    			} else {
	    				this._scale = this.key.getScale();
	    				return this._scale;
	    			}
	    		},
	    	},
	    	'key' : { 
               enumerable: true,	    	    
	    	   get: function () { return this._key; },
	    	   set: function(keyStr) {
	    	       if (typeof(keyStr) == 'string') {
	    	            this._key = new key.Key(keyStr);
	    	        } else if (typeof(keyStr) == 'undefined') {
	    	            this._key = new key.Key('C');
	    	        } else {
	    	            this._key = keyStr;
	    	        }
	    	   },
	    	},
	    	'degreeName': {
                enumerable: true,
	    		get: function () {
	    			if (this.scaleDegree < 7) {
	    				return [undefined, 'Tonic', 'Supertonic','Mediant','Subdominant','Dominant','Submediant'][this.scaleDegree];
	    			} else {
	    				var tonicPitch = new pitch.Pitch(this.key.tonic);
	    				var diffRootToTonic = (tonicPitch.ps - this.root.ps) % 12;
	    				if (diffRootToTonic < 0) {
	    					diffRootToTonic += 12;
	    				}
	    				if (diffRootToTonic == 1) {
	    					return "Leading-tone";
	    				} else {
	    					return "Subtonic";
	    				}
	    			}
	    		}
	    	}
	    });		

	    
		this.key = keyStr;
		var currentFigure = figure;
		
		var impliedQuality = 'major';
		var lowercase = currentFigure.toLowerCase();
		if (currentFigure.match('/o')) {
			impliedQuality = 'half-diminished';
			currentFigure = currentFigure.replace('/o','');
		} else if (currentFigure.match('o')) {
			impliedQuality = 'diminished';
			currentFigure = currentFigure.replace('o', '');
		} else if (currentFigure == lowercase) {
			impliedQuality = 'minor';
		}
			
		var numbersArr = currentFigure.match(/\d+/); 
		this.numbers = undefined;
		if (numbersArr != null) {
			currentFigure = currentFigure.replace(/\d+/, '');
			this.numbers = parseInt(numbersArr[0]);
		}
		
		var scaleDegree = roman.romanToNumber.indexOf(currentFigure.toLowerCase());
		if (scaleDegree == -1) {
			throw("Cannot make a romanNumeral from " + currentFigure);
		}
		this.scaleDegree = scaleDegree;
		this.root = this.scale[this.scaleDegree - 1];
		
		if (this.key.mode == 'minor' && (this.scaleDegree == 6 || this.scaleDegree == 7)) {
			if (['minor','diminished','half-diminished'].indexOf(impliedQuality) != -1) {
				var raiseTone = new interval.Interval('A1');
				this.root = raiseTone.transposePitch(this.root);
				if (music21.debug) {
					console.log('raised root because minor/dim on scaleDegree 6 or 7');
				}
			}
		}
		
		/* temp hack */
		if (this.numbers == 7) {
			if (scaleDegree == 5 && impliedQuality == 'major') {
				impliedQuality = 'dominant-seventh';
			} else {
				impliedQuality += '-seventh';
			}
		}
		
		
		this.impliedQuality = impliedQuality;
		this.updatePitches();	
	};

	roman.RomanNumeral.prototype = new chord.Chord();
	roman.RomanNumeral.prototype.constructor = roman.RomanNumeral;
	
	/**
	 * Update the .pitches array.  Called at instantiation, but not automatically afterwards.
	 * 
	 * @memberof music21.roman.RomanNumeral
	 */
    roman.RomanNumeral.prototype.updatePitches = function () {
        var impliedQuality = this.impliedQuality;
        var chordSpacing = chord.chordDefinitions[impliedQuality];
        var chordPitches = [this.root];
        var lastPitch = this.root;
        for (var j = 0; j < chordSpacing.length; j++) {
            //console.log('got them', lastPitch);
            var thisTransStr = chordSpacing[j];
            var thisTrans = new interval.Interval(thisTransStr);
            var nextPitch = thisTrans.transposePitch(lastPitch);
            chordPitches.push(nextPitch);
            lastPitch = nextPitch;
        }
        this.pitches = chordPitches;
    };
    
    /**
     * Gives a string display.  Note that since inversion is not yet supported
     * it needs to be given separately.
     * 
     * Inverting 7th chords does not work.
     * 
     * @memberof music21.roman.RomanNumeral
     * @param {string} displayType - ['roman', 'bassName', 'nameOnly', other]
     * @param {Int} [inversion=0]
     * @returns {String}
     */
    roman.RomanNumeral.prototype.asString = function (displayType, inversion) {
        var keyObj = this.key;
        var tonic = keyObj.tonic;
        var mode = keyObj.mode;
        
        if (inversion === undefined) {
            inversion = 0;
        }
        var inversionName = "";
        if (inversion == 1) {
            if (displayType == 'roman') {
                inversionName = '6';
            } else {
                inversionName = ' (first inversion)';
            }
        } else if (inversion == 2) {
            if (displayType == 'roman') {
                inversionName = '64';
            } else {
                inversionName = ' (second inversion)';
            }
        }
        var fullChordName;
        var connector = ' in ';
        var suffix = '';
        if (displayType == 'roman') {
            fullChordName = this.figure;
        } else if (displayType == 'nameOnly') { // use only with only choice being TONIC
            fullChordName = "";
            connector = '';
            suffix = ' triad';
        } else if (displayType == 'bassName') {
            fullChordName = this.bass().name.replace(/\-/, 'b');
            connector = ' in ';
            suffix = '';            
        } else { // "default" submediant, etc...
            fullChordName = this.degreeName;
            if (this.numbers != undefined) {
                fullChordName += " " + this.numbers.toString();
            }
        }
        var tonicDisplay = tonic.replace(/\-/, 'b');
        if (mode == 'minor') {
            tonicDisplay = tonicDisplay.toLowerCase();
        }
        var chordStr = fullChordName + inversionName + connector + tonicDisplay + " " + mode + suffix;
        return chordStr;
    };
	
	roman.tests = function () {
	    test ( "music21.roman.RomanNumeral" , function() {
	        var t1 = "IV";
            var rn1 = new music21.roman.RomanNumeral(t1, "F");
	        equal (rn1.scaleDegree, 4, 'test scale dgree of F IV');
	        var scale = rn1.scale;
	        equal (scale[0].name, "F", 'test scale is F');
	        equal (rn1.root.name, "B-", 'test root of F IV');
	        equal (rn1.impliedQuality, 'major', 'test quality is major');
	        equal (rn1.pitches[0].name, 'B-', 'test pitches[0] == B-');
	        equal (rn1.pitches[1].name, 'D', 'test pitches[1] == D');
	        equal (rn1.pitches[2].name, 'F', 'test pitches[2] == F');
	        equal (rn1.degreeName, 'Subdominant', 'test is Subdominant');
	        
	        var t2 = 'viio7';
	        rn1 = new music21.roman.RomanNumeral(t2, "a");
	        equal (rn1.scaleDegree, 7, 'test scale dgree of A viio7');
	        equal (rn1.root.name, "G#", 'test root name == G#');
	        equal (rn1.impliedQuality, 'diminished-seventh', 'implied quality');
	        equal (rn1.pitches[0].name, 'G#', 'test pitches[0] == G#');
	        equal (rn1.pitches[1].name, 'B', 'test pitches[1] == B');
	        equal (rn1.pitches[2].name, 'D', 'test pitches[2] == D');
	        equal (rn1.pitches[3].name, 'F', 'test pitches[3] == F');
	        equal (rn1.degreeName, 'Leading-tone', 'test is Leading-tone');

	        t2 = 'V7';
	        rn1 = new music21.roman.RomanNumeral(t2, "a");
	        equal (rn1.scaleDegree, 5, 'test scale dgree of a V7');
	        equal (rn1.root.name, "E", 'root name is E');
	        equal (rn1.impliedQuality, 'dominant-seventh', 'implied quality dominant-seventh');
	        equal (rn1.pitches[0].name, 'E', 'test pitches[0] == E');
	        equal (rn1.pitches[1].name, 'G#', 'test pitches[1] == G#');
	        equal (rn1.pitches[2].name, 'B', 'test pitches[2] == B');
	        equal (rn1.pitches[3].name, 'D', 'test pitches[3] == D');
	        equal (rn1.degreeName, 'Dominant', 'test is Dominant');
	        
	        t2 = 'VII';
	        rn1 = new music21.roman.RomanNumeral(t2, "f#");
	        equal (rn1.scaleDegree, 7, 'test scale dgree of a VII');
	        equal (rn1.root.name, "E", 'root name is E');
	        equal (rn1.impliedQuality, 'major', 'implied quality major');
	        equal (rn1.pitches[0].name, 'E', 'test pitches[0] == E');
	        equal (rn1.pitches[1].name, 'G#', 'test pitches[1] == G#');
	        equal (rn1.pitches[2].name, 'B', 'test pitches[2] == B');
	        equal (rn1.degreeName, 'Subtonic', 'test is Subtonic');
	        
	    });

	    test ( "music21.roman.RomanNumeral - inversions" , function() {
	        var t1 = "IV";
	        var rn1 = new music21.roman.RomanNumeral(t1, "F");
	        equal (rn1.scaleDegree, 4, 'test scale dgree of F IV');
	        var scale = rn1.scale;
	        equal (scale[0].name, "F", 'test scale is F');
	        equal (rn1.root.name, "B-", 'test root of F IV');
	        equal (rn1.impliedQuality, 'major', 'test quality is major');
	        equal (rn1.pitches[0].name, 'B-', 'test pitches[0] == B-');
	        equal (rn1.pitches[1].name, 'D', 'test pitches[1] == D');
	        equal (rn1.pitches[2].name, 'F', 'test pitches[2] == F');
	        equal (rn1.degreeName, 'Subdominant', 'test is Subdominant');   
	    });  
	};
	
	// end of define
	if (typeof(music21) != "undefined") {
		music21.roman = roman;
	}		
	return roman;
});