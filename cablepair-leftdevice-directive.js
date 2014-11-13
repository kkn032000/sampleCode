/**
 * @fileoverview This draws the cable pair view.
 */

goog.provide('dh.cablePair.cablePairLeftDeviceDirective');

goog.require('dh.cablePair.CablePairCtrl');
goog.require('dh.cablePair.utils');
goog.require('goog.array');


/**
 * Draws a left side device, with ports/connectors oriented right.
 * @return {angular.Directive} The directive definition.
 * @ngInject
 */
dh.cablePair.cablePairLeftDeviceDirective = function() {
  return {
    controller: dh.cablePair.CablePairCtrl,
    controllerAs: 'cablePairController',
    link: linkFn
  };

  /**
   * Interact with controller.
   * @param {!angular.Scope} scope The current scope.
   * @param {!angular.JQLite} element The directive element.
   * @param {!angular.Attributes} attrs The directive attributes.
   * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
   */
  function linkFn(scope, element, attrs, ctrl) {
    var mainContainer = d3.select('.cable-pair-main')[0][0];
    d3.select('.cable-pair-svg-container').
        attr('height', mainContainer.getBoundingClientRect().height).
        attr('width', mainContainer.getBoundingClientRect().width - 20);

    scope.$watch(attrs['dhCablePairLeftDevice'], function(newval, oldval) {
      if (newval) {
        initCanvas_(element, newval, scope, ctrl);
      }
    });
  }

  /**
   * Draws initial svg canvas.
   * @param {!angular.JQLite} element The directive element.
   * @param {!json.DeviceCatalogContent} device The device data.
   * @param {!angular.Scope} scope The current scope.
   * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
   * @private
   */
  function initCanvas_(element, device, scope, ctrl) {
    // Get device height.
    var deviceHeight = dh.cablePair.utils.getCardHeight(device);
    var container = d3.select('.cable-pair-data');

    ctrl.scope.leftDeviceHeight = deviceHeight;

    // Clean-up previous device space.
    d3.selectAll(element[0].childNodes).remove();

    // Create invisible svg.
    ctrl.invisibleSVG = /** @type {D3Type} */ (
        d3.select('.cable-pair-zeroheight-svg'));

    // The device tooltip message: defaults to 'Unnamed' when no values present.
    var deviceTooltipMessage = (
        device.type_name ? device.type_name + ': ' : '') + (
        device.name || ctrl.DEFAULT_UNNAMED);

    // Initial Group container for device.
    var deviceGrpContainer = /** @type {D3Type} */ (
        d3.select(element[0]).data([device]).
        on('dblclick', function() {
          flipDevice_(deviceGrpContainer);
        }).
        attr('data-tooltip', deviceTooltipMessage).
        attr('height', deviceHeight).
        attr('class', 'left-device-container').
        attr('transform', 'translate(20, 20)'));

    // Initial call to drawCard function.
    if (deviceHeight != 0) {
      dh.cablePair.utils.drawCard(deviceGrpContainer, true, true, ctrl);
      dh.cablePair.utils.drawRemoveIcon(deviceGrpContainer, ctrl, false, false);
    } else {
      deviceGrpContainer.append('svg:text').
          text('Device has no ports and cards to display.');
    }

    scope.$emit('stopSpinner');
    dh.cablePair.utils.setCanvasHeight(ctrl);
    scope.$emit('deviceReady');
  };

  /**
   * Flip device horizontally.
   * @param {D3Type} grpElement The svg group element.
   * @private
   */
  function flipDevice_(grpElement) {
    var data = grpElement[0][0]['__data__'];
    var gWidth, portLabels, yAxis;

    if (!data.flipHorizontal) {
      gWidth = grpElement[0][0].getBoundingClientRect().width + 20;
      grpElement.attr('transform',
                      'scale(-1 1)  translate(' + -gWidth + ' 20)');
      grpElement.selectAll('.card-label').
          attr('transform', 'scale(-1 1) rotate(90) translate(15 15)');
      portLabels = grpElement.selectAll('.port-label')[0];
      goog.array.forEach(portLabels, function(lableNode) {
        yAxis = lableNode['__data__'].y + 10;
        d3.select(lableNode).attr('transform',
                                  'scale(-1 1) rotate(90) ' +
                                  'translate(' + yAxis + ' , 35)');
      });
      data.flipHorizontal = true;
    } else {
      grpElement.attr('transform', 'scale(1 1) translate(20 20)');
      grpElement.selectAll('.card-label').
          attr('transform', 'rotate(90 -4,10)');
      portLabels = grpElement.selectAll('.port-label')[0];
      goog.array.forEach(portLabels, function(lableNode) {
        yAxis = lableNode['__data__'].y + 10;
        d3.select(lableNode).
            attr('transform', 'rotate(90) translate(' + yAxis + ', -25)');
      });
      data.flipHorizontal = false;
    }
  };
};
