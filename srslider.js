/**
 * The Simple Responsive Slider class that handles all the transitions for
 * the image slider. If Modernizr is available, we will check if CSS is
 * capable of handling transitions, otherwise we rely on jQuery to animate
 * the images.
 *
 * @author JohnG <john.gieselmann@gmail.com>
 *
 * @version 0.1
 */
(function(window, document, $, undefined) {

    function SRSlider() {

        var self = this;

        /**
         * The default settings for the slider. These can be overridden by
         * passing in a matching object into the init function.
         * @var obj defaults
         */
        this.settings = {};
        this.defaults = {
            container: ".js-slider", // selector for our targeted container
            delay:     3000,         // delay between rotations
            pause:     true,         // whether or not to pause on hover
            transTime: 500,          // transition time in ms for jq animations
            type:      "rotate"      // the type of transition to use
        };

        /**
         * Flag for whether or not CSS transitions are supported. It is set
         * on init, and requires Modernizr to actually set.
         * @var bool cssTrans
         */
        this.cssTrans = false;

        /**
         * Retain the container as its own property.
         * @var jqObj container
         */
        this.container = null;

        /**
         * Keep track of all the slides in the slider.
         * @var jqObj slides
         */
        this.slides = null;

        /**
         * Keep track of the order of the slides.
         * @var jqObj previous, current, next
         */
        this.previous = null;
        this.current = null;
        this.next = null;

        /**
         * Keep track of the index of the current slide as well as the number
         * of slides.
         * @var int curIndex, slidesLength
         */
        this.curIndex = 0;
        this.slidesLength = null;

        /**
         * The interval variable set when calling setInterval. Store this
         * so we can destroy intervals on hover.
         * @var int interval
         */
        this.interval = null;

        /**
         * Flag for whether or not the slider is actively rotating pictures.
         * @var bool sliding
         */
        this.sliding = false;

        /**
         * Initialize a slider on a minimum of 3 images.
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @param obj options. The optional options to set for the slider
         * class. This should mimic the defaults property for proper overriding
         * of... defaults. Naild it.
         *
         * @return void
         */
        this.init = function(options) {

            // capture the options
            options = options || {};

            // create the settings by merging the defaults with the options
            $.extend(self.settings, self.defaults, options);

            // set the container if it is not already a jQuery object
            self.container = self.settings.container;
            if (typeof self.container === "string") {
                self.container = $(self.container);
            }

            // before we start doing all these calculations make sure we
            // have a container
            if (!self.container.length) {
                return false;
            }

            // check if this browser supports CSS transitions
            if (   typeof window.Modernizr !== "undefined"
                && window.Modernizr.csstransitions
            ) {
                self.cssTrans = true;
            }

            // capture the slide elements and bind the events to them
            self.captureElements();
            self.bindEvents();

            // prepare the slides for launch
            switch (self.settings.type) {
                case "dissolve":
                    self.current
                        .addClass("srs-fadein");
                    break;

                case "rotate":
                default:
                    self.current
                        .css({
                            left: 0
                        });
                    break;
            }

            // scale the images as soon as they load
            self.current.find("img").on("load", self.scaleSlider);

            // start the interval
            self.startSlider();
        };

        /**
         * Capture all the elements for the slider within the container.
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return void
         */
        this.captureElements = function() {

            // capture all the slides and set the current (first)
            self.slides = self.container.find(".js-slide");
            self.slidesLength = self.slides.length;

            self.curIndex = 0;
            self.current = self.slides
                .eq(self.curIndex)
                .addClass("js-current");

        };

        /**
         * Bind the events for the slider
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return void
         */
        this.bindEvents = function() {
            //jam
            // TODO FIX THIS TO NOT BE DEPENDENT ON MODERNIZER
            var eType = window.Modernizr.touch
                ? "touchend"
                : "mouseover mouseout"

            // only pause the slider if the settings want us to do so
            if (self.settings.pause) {
                self.container.on(eType, self.toggleSlider);
            }

            // scale the slider on resize
            $win.resize(self.scaleSlider);
        };

        /**
         * Scale the slider to fit everything nicely.
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return void
         */
        this.scaleSlider = function() {
            // set the height of the slider
            self.container
                .css({
                    height: self.current.find("img").height()
                });

        };

        /**
         * Toggle the slider on and off (actively rotating images vs pausing).
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return void
         */
        this.toggleSlider = function() {
            // if we are currently sliding, pause it, otherwise resume sliding
            if (self.sliding) {
                self.pauseSlider();
            } else {
                self.startSlider();
            }
        };

        /**
         * Start sliding the images.
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return void
         */
        this.startSlider = function() {
            self.interval = setInterval(self.animate, self.settings.delay);
            self.sliding = true;
        };

        /**
         * Pause the slider.
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return void
         */
        this.pauseSlider = function() {
            clearInterval(self.interval);
            self.sliding = false;
        };

        /**
         * Get the previous slide (was just the current) based on the
         * current index.
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return void
         */
        this.setPositions = function() {

            // set/get the previous slide
            if (self.curIndex == 0) {
                self.previous = self.slides.eq(self.slidesLength - 1);
            } else {
                self.previous = self.slides.eq(self.curIndex - 1);
            }

            // set/get the next slide and the new currentIndex
            if (self.curIndex < (self.slidesLength - 1)) {
                self.curIndex++;
            } else {
                self.curIndex = 0;
            }

            self.next = self.slides.eq(self.curIndex);
        };

        /**
         * Set the currently visible slide in the slider.
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return jqObj self.current
         */
        this.setCurrent = function() {
            self.current = self.container.find(".js-current");

            return self.current;
        };

        /**
         * Animate the transition between slides while updating the new slide
         * positions.
         *
         * @author JohnG <john.gieselmann@gmail.com>
         *
         * @return void
         */
        this.animate = function() {

            // set the new slide positions
            self.setPositions();

            switch (self.settings.type) {

                // dissolve between images
                case "dissolve":

                    // fadeout the current slide with CSS if possible,
                    // otherwise default to jQuery
                    if (self.cssTrans) {
                        self.current
                            .addClass("srs-fadeout")
                            .removeClass("srs-fadein js-current");
                    } else {
                        self.current
                            .fadeOut(self.settings.transTime)
                            .removeClass("js-current");
                    }

                    // fadein the current slide with CSS if possible,
                    // otherwise default to jQuery
                    if (self.cssTrans) {
                        self.next
                            .removeClass("srs-fadeout")
                            .addClass("srs-fadein js-current");
                    } else {
                        self.next
                            .fadeIn(self.settings.transTime)
                            .addClass("js-current");
                    }

                    break;

                // slide images to the left (requires at least three images)
                case "rotate":
                default:

                    // hide the previous and move it to the right so it can
                    // slide left when needed
                    if (self.cssTrans) {
                        self.previous
                            .hide()
                            .addClass("srs-slideright");
                    } else {
                        self.previous
                            .hide()
                            .css({
                                left: "100%"
                            });
                    }

                    // move the current to the left off the display
                    if (self.cssTrans) {
                        self.current
                            .addClass("srs-slideleft")
                            .removeClass("js-current");
                    } else {
                        self.current
                            .animate({
                                left: "-100%"
                            }, self.settings.transTime)
                            .removeClass("js-current");
                    }

                    // prepare the next slide to slide in
                    if (self.cssTrans) {
                        self.next
                            .show()
                            .removeClass("srs-slideright")
                            .addClass("js-current");
                    } else {
                        self.next
                            .show()
                            .animate({
                                left: "0"
                            }, self.settings.transTime)
                            .addClass("js-current");
                    }

                    break;
            }

            // set the new current slide
            self.setCurrent();
        };
    };

    // assign the class to the window
    window.SRSlider = SRSlider;

})(window, document, jQuery, undefined);
