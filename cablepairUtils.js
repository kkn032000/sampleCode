/**
 * @fileoverview Cable Pair View related utilities.
 */

goog.provide('dh.cablePair.utils');

goog.require('dh.utils.Constants');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.html.SafeHtml');
goog.require('goog.object');
goog.require('jfk.ButterBar');
goog.require('jfk.googdialog');


/**
 * Gets card or device height based on number of ports and cards
 * for a device that's drawn vertically for cable pairing view.
 * @param {?json.DeviceCatalogContent} device The device data.
 * @return {number} The height of a card or a device in pixels.
 */
dh.cablePair.utils.getCardHeight = function(device) {
  if (goog.isNull(device)) {
    return 0;
  }

  var numberOfConnectors;
  var portHeight = 0;

  // Find ports height.
  if (device.ports) {
    goog.array.forEach(device.ports, function(port) {
      numberOfConnectors = (port.connectors > 0) ? port.connectors :
          dh.cablePair.utils.DEFAULT_CONNECTORS;
      portHeight += (numberOfConnectors * (20 + 5) + 5);
    });
    if (device.ports.length > 0) {
      portHeight += (device.ports.length * 5) + 5;
    }
  }

  var cHeight = 0;
  var cardsHeight = 0;

  // Find cards height.
  if (device.slots) {
    goog.array.forEach(device.slots, function(slot) {
      goog.object.forEach(slot.cards, function(card) {
        cHeight = dh.cablePair.utils.getCardHeight(card);
        if (cHeight > 0) {
          cardsHeight += cHeight + 5;
        }
      });
    });
  }


  cardsHeight += portHeight;
  if (portHeight == 0 && cardsHeight > 0) {
    cardsHeight += 5;
  }

  return cardsHeight;
};


/**
 * Draw card.
 * @param {D3Type} grpElement The svg group element.
 * @param {boolean} isDevice Indicates if the card is a parent device.
 * @param {boolean} isLeft Indicates position of device.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 */
dh.cablePair.utils.drawCard = function(grpElement, isDevice, isLeft, ctrl) {
  var cardObj = grpElement[0][0]['__data__'];

  // Get card height.
  var cardHeight = dh.cablePair.utils.getCardHeight(cardObj);

  // Draw card.
  grpElement.append('svg:rect').attr('height', cardHeight).
      attr('width', 20).attr('fill', function() {
        return isDevice ? '#a6d7e0' : '#d0e0e3';
      });

  // Draw label.
  dh.cablePair.utils.addLabel_(grpElement, cardObj.name, cardHeight,
      false, 0);
  // Draw ports of the card.
  var lastPortPoint = dh.cablePair.utils.drawPorts_(
      cardObj.ports, grpElement, isLeft, ctrl);

  var cardGrpContainer;

  // Call drawCard function for each card in a slot.
  goog.array.forEach(cardObj.slots || [], function(slot) {
    goog.object.forEach(slot.cards, function(card) {
      // Get card height.
      cardHeight = dh.cablePair.utils.getCardHeight(card);

      // Create groupContainer and add data to it.
      if (cardHeight > 0) {
        cardGrpContainer = grpElement.append('svg:g').data([card]).
            attr('height', cardHeight).
            attr('class', 'cardGrpContainer').
            attr('transform', 'translate(20,' + lastPortPoint + ')');
        lastPortPoint = lastPortPoint + cardHeight + 5;

        // Call drawCard for each card.
        dh.cablePair.utils.drawCard(cardGrpContainer, false, isLeft, ctrl);
      }
    });
  });
};


/**
 * Draws the remove icon for devices and sockets.
 * @param {D3Type|Function} grpElement The svg group element.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 * @param {boolean} isRackSockets Indicates the icon is for sockets.
 * @param {boolean} isRightDevice Indicates the icon is for right device.
 */
dh.cablePair.utils.drawRemoveIcon = function(
    grpElement, ctrl, isRackSockets, isRightDevice) {
  var removeIconGroup = grpElement.append('svg:g').
      on('click', function() {
        var rightEntity = isRackSockets || isRightDevice;
        dh.cablePair.utils.removeDeviceOrSockets(
            ctrl, grpElement, rightEntity);
      });

  removeIconGroup.append('circle').attr('r', 7).
      attr('transform', 'translate(-1, -1)').
      attr('class', 'removeicon-circle');
  removeIconGroup.append('line').attr('x1', -4).
      attr('y1', -5).attr('x2', 2).
      attr('y2', 2).attr('class', 'removeicon-line');
  removeIconGroup.append('line').attr('x1', 2).
      attr('y1', -5).attr('x2', -4).
      attr('y2', 2).attr('class', 'removeicon-line');
  if (isRackSockets) {
    removeIconGroup.attr('transform', 'translate(110, 0)');
  }
};


/**
 * Draws the label for cards and ports.  Cuts the label off if
 * the label width is wider than the containing element.
 * @param {D3Type|Function} grpElement The svg group element.
 * @param {string} label Label name to display.
 * @param {number} height The Height of card or port.
 * @param {boolean} isPort Indicates whether the element is a port or not.
 * @param {number} lastPortPoint Y coordinate of last port.
 * @private
 */
dh.cablePair.utils.addLabel_ = function(
    grpElement, label, height, isPort, lastPortPoint) {
  var fontSize = isPort ? '10px' : '';

  var invisibleSVG = d3.select('.cable-pair-zeroheight-svg');
  // Add label to invisible svg to find width.
  var textNode = invisibleSVG.append('svg:text').
      attr('class', 'card-label').
      style('font-size', fontSize).
      text(label);
  var labelWidth = textNode[0][0].getBoundingClientRect().width;
  textNode.remove();

  var className = isPort ? 'port-label' : 'card-label';

  var transformValue;
  if (isPort) {
    transformValue = 'translate(25, ' + (lastPortPoint + 7) + ') rotate(90)';
  } else {
    transformValue = 'rotate(90 -4,10)';
  }

  var margin = isPort ? 20 : 40;

  if (labelWidth < height - margin) {
    grpElement.append('svg:text').attr('class', className).
        attr('transform', transformValue).
        style('font-size', fontSize).
        text(label);
  } else {
    var width = Math.ceil(labelWidth / label.length);
    var numberOfChars = Math.floor((height - 40) / width + (isPort ? 4 : 1));

    var subText = label.substring(0, numberOfChars) + (isPort ? '..' : '...');
    grpElement.append('svg:text').attr('class', className).
        attr('transform', transformValue).
        style('font-size', fontSize).
        text(subText);
  }
};


/**
 * Determines whether the port is a powerPort.
 * @param {!json.ConnectorPort} port The port.
 * @return {boolean|string}
 * @private
 */
dh.cablePair.utils.isPowerPort_ = function(port) {
  return port.interface && goog.array.contains(
      dh.utils.Constants.PortInterface.POWER_TYPES,
      port.interface.toLowerCase());
};


/**
 * Determines whether the port is a fiberPort.
 * @param {!json.ConnectorPort} port The port.
 * @return {boolean|string}
 * @private
 */
dh.cablePair.utils.isFiberPort_ = function(port) {
  return port.interface && goog.array.contains(
      dh.utils.Constants.PortInterface.FIBER_TYPES,
      port.interface.toUpperCase());
};


/**
 * Draw ports.
 * @param {!Array<json.ConnectorPort>} ports The array of ports.
 * @param {D3Type|Function} grpElement The svg group element.
 * @param {boolean} isLeft Indicates position of device.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 * @return {number} The y coordinate of last port drawn.
 * @private
 */
dh.cablePair.utils.drawPorts_ = function(ports, grpElement, isLeft, ctrl) {
  var lastPortPoint = 5;
  var lastConnectorPoint = 5;

  goog.object.forEach(ports, function(port) {
    var numConnectors = port.connectors;
    var portClass = 'port-available';

    numConnectors = numConnectors > 0 ? numConnectors : 2;
    var portHeight = numConnectors * (20 + 5) + 5;

    if (port.physical_usage_status == 'Reserved') {
      portClass = 'port-reserved';
    } else if (port.physical_usage_status == 'In Use') {
      portClass = 'port-used';
    }

    var powerPort = dh.cablePair.utils.isPowerPort_(port);
    var fiberPort = dh.cablePair.utils.isFiberPort_(port);

    // Draw port.
    var portContainer = grpElement.append('svg:g').
        attr('class', function() {
          var powerStatus = powerPort ? 'power-port' : 'non-power-port';
          var fiberStatus = fiberPort ? 'fiber-port' : 'non-fiber-port';
          var status = 'port' + ' ' + powerStatus + ' ' + fiberStatus;

          return status;
        }).
        data([{'y': lastPortPoint, 'name': port.name}]);

    portContainer.append('svg:rect').
        attr('height', portHeight).
        attr('width', 20).
        attr('class', function() {
          var status;
          if (powerPort) {
            status = portClass + ' ' + dh.cablePair.utils.POWER_PORT_CLASS_;
          } else if (fiberPort) {
            status = portClass + ' ' + dh.cablePair.utils.FIBER_PORT_CLASS_;
          } else {
            status = portClass;
          }
          return status;
        }).
        attr('rx', 4).
        attr('transform',
             'translate(' + 20 + ', ' + lastPortPoint + ')');

    // Draw circle inside port to show logical usage status.
    if (port.logical_usage_status) {
      portContainer.append('circle').
          attr('r', 3).
          attr('class',
               'port-logical-state-' + port.logical_usage_status.toLowerCase()).
          attr('transform',
               'translate(' + 33 + ',' + (lastPortPoint + 49) + ')');
    }

    // Draw port's label.
    dh.cablePair.utils.addLabel_(portContainer, port.name, portHeight, true,
        lastPortPoint);

    lastConnectorPoint = 5 + lastPortPoint;

    // Draw connectors.
    for (var i = 0; i < numConnectors; i++) {
      portContainer.append('svg:rect').data([port]).
          attr('height', 20).
          attr('width', 10).
          attr('class', portClass).
          attr('isLeft', isLeft.toString()).
          attr(dh.cablePair.utils.ATTR_CONNECTED,
              (!(portClass == 'port-available')).toString()).
          attr('rx', 3).
          attr('c-index', i). // To find selected connector of a port.
          attr('transform',
               'translate(' + 40 + ', ' + lastConnectorPoint + ')').
          on('click', function() {
            dh.cablePair.utils.drawStrand(this, ctrl);
          });
      lastConnectorPoint = lastConnectorPoint + 20 + 5;
    }
    lastPortPoint = lastPortPoint + portHeight + 5;
  });
  return lastPortPoint;
};


/**
 * Cancels the connection across all connectors.
 * @param {Node|string=} opt_connector The node that triggered the event.
 */
dh.cablePair.utils.cancelConnection = function(opt_connector) {
  var fn = opt_connector ? 'select' : 'selectAll';
  opt_connector = opt_connector || '.port-available';
  d3[fn](opt_connector).classed('begin-flash', false);
  dh.cablePair.utils.removeDanglingStrandBoxes();
  dh.cablePair.utils.resetStartConnector();
  dh.cablePair.utils.removeStatusMessage();
};


/**
 * Resets the start connector to null.
 */
dh.cablePair.utils.resetStartConnector = function() {
  dh.cablePair.utils.startConnector_ = null;
};


/**
 * Resets the overhead strand status message.
 */
dh.cablePair.utils.removeStatusMessage = function() {
  d3.select('.cable-pair-status-message').text('');
};


/**
 * Tests whether the startConnector and element argument are on the same side.
 * @param {D3Type} elem The element that triggered the event.
 * @return {?boolean}
 */
dh.cablePair.utils.sameSide = function(elem) {
  return dh.cablePair.utils.startConnector_ &&
      d3.select(dh.cablePair.utils.startConnector_).attr('isLeft') ==
      elem.attr('isLeft');
};


/**
 * Tests whether the startConnector and elem argument are the same connector.
 * @param {Node} elem The element that triggered the event.
 * @return {?boolean}
 */
dh.cablePair.utils.sameConnector = function(elem) {
  return dh.cablePair.utils.startConnector_ && elem ==
      dh.cablePair.utils.startConnector_;
};


/**
 * Gets the strand object for use by the CablePair menu.
 * @param {Node} self The node that triggered the event.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 * @param {boolean=} opt_insert Whether or not to insert the strand object.
 * @return {?Object} The saved strand object.
 */
dh.cablePair.utils.newStrandObject = function(self, ctrl, opt_insert) {
  var aConnector = d3.select(dh.cablePair.utils.startConnector_);
  var currentNode = d3.select(self);
  return ctrl.cablePair.newStrand(aConnector, currentNode, opt_insert);
};


/**
 * Draws the dangling strand box for the given node.
 * @param {Node} self The node that triggered the event.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 * @return {?D3Type}
 */
dh.cablePair.utils.newStrandGroup = function(self, ctrl) {
  var strandObject = dh.cablePair.utils.newStrandObject(self, ctrl);
  var strandGroup = d3.select('.cable-pair-svg-container').
      append('svg:g').
      attr('class', 'cable-pair-strand').
      data([strandObject]);
  return strandGroup;
};


/**
 * Draws the dangling strand box for the given node.
 * @param {Node} self The node that triggered the event.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 */
dh.cablePair.utils.drawDanglingStrand = function(self, ctrl) {
  var danglingOffset = dh.cablePair.utils.DANGLING_STRAND_X_OFFSET;
  var danglingTextOffset = dh.cablePair.utils.DANGLING_STRAND_TEXT_X_OFFSET;
  var isLeft = self.getAttribute('isLeft') == 'true';
  var strandGroup = dh.cablePair.utils.newStrandGroup(self, ctrl);
  var strandObject = dh.cablePair.utils.newStrandObject(self, ctrl);
  var x = d3.event.offsetX;
  var y = (d3.event.offsetY - Math.floor(d3.mouse(self)[1]) + 10);

  if (!isLeft) {
    var additionalTextOffset = 82;
    danglingOffset = -Math.abs(danglingOffset);
    danglingTextOffset = -Math.abs(danglingTextOffset) - additionalTextOffset;
  }

  strandGroup.
      append('circle').
      attr('cx', x + danglingOffset).
      attr('cy', y).
      attr('r', dh.cablePair.utils.DANGLING_STRAND_CIRCLE_RADIUS).
      attr('class', dh.cablePair.utils.DANGLING_STRAND_CIRCLE_CLASS).
      on('click', function() {
        /* Save the strand object to application memory */
        ctrl.cablePair.saveStrandToStrands(strandObject);
        d3.select(this).attr('class',
            dh.cablePair.utils.STRAND_MIDDLE_CIRCLE_CLASS).
            on('click', function() {
              ctrl.scope.$parent.selectedStrand = strandGroup;
              dh.cablePair.utils.showStrandMenu_(ctrl, strandObject);
              ctrl.scope.$apply();
            });
        strandGroup.
            insert('line', ':first-child').
            attr('x1', x).
            attr('y1', y).
            attr('x2', x + danglingOffset).
            attr('y2', y).
            attr('class', dh.cablePair.utils.STRAND_LINE_CLASS).
            attr('isLeft', isLeft.toString()).
            transition().duration(500).style('opacity', 1);
        strandGroup.
            append('circle').
            attr('cx', x).
            attr('cy', y).
            attr('r', dh.cablePair.utils.STRAND_END_CIRCLE_RADIUS).
            attr('class',
            dh.cablePair.utils.STRAND_END_CIRCLE_CLASS).
            transition().duration(500).style('opacity', 1);
        dh.cablePair.utils.setConnectedStatus(self);
        dh.cablePair.utils.cancelConnection();
      });
  ctrl.scope.$parent.selectedStrand = strandGroup;
  ctrl.scope.$apply();
  strandGroup.append('text').
      attr('class', dh.cablePair.utils.DANGLING_STRAND_TEXT_CLASS).
      attr('x', x + danglingTextOffset).
      attr('y', y + dh.cablePair.utils.DANGLING_STRAND_TEXT_Y_OFFSET).
      attr('fill', 'black').
      text('Dangling strand');
};


/**
 * Removes the dangling strand boxes.
 */
dh.cablePair.utils.removeDanglingStrandBoxes = function() {
  d3.select('.strand-dangling-circle').remove();
  d3.select('.strand-dangling-text').remove();
};


/**
 * Set connected status attribute on nodes.
 * @param {Node|Array<Node>} nodes The Node or Nodes to set or select then set.
 */
dh.cablePair.utils.setConnectedStatus = function(nodes) {
  var isArray = goog.isArray(nodes);
  nodes = /** @type {Array<Node>}*/ (isArray ? nodes : [nodes]);
  goog.array.forEach(nodes, function(elem) {
    var isD3 = elem instanceof d3.selection;
    isD3 ? elem.attr(dh.cablePair.utils.ATTR_CONNECTED, 'true') :
        d3.select(elem).attr(dh.cablePair.utils.ATTR_CONNECTED, 'true');
  });
};


/**
 *  Displays message for strand creation initiation and binds cancel action.
  * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 */
dh.cablePair.utils.showStrandCreationBanner = function(ctrl) {
  d3.select('.cable-pair-status-message').
      style('left', (ctrl.scope.topBarWidth - 141) / 2 + 'px').
      html('Strand creation initiated. ' +
          '<a href="#" class="cable-pair-cancel">Cancel</a>').
      style('opacity', 0).
      transition().duration(250).style('opacity', 1);
  d3.select('.cable-pair-cancel').on('click', function() {
    dh.cablePair.utils.cancelConnection();
  });
};


/**
 * Draws strand: dangling and between connectors.
 * @param {Node} self The node that triggered the event.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 */
dh.cablePair.utils.drawStrand = function(self, ctrl) {
  var currentNode = d3.select(self);
  var startConnector = dh.cablePair.utils.startConnector_;
  var svgWidth = d3.select('.cable-pair-svg-container')[0][0].
          getBoundingClientRect().width;
  var isLeft = self.getAttribute('isLeft') == 'true';
  var offset;

  // Turn off flashing on second click of startConnector.
  if (dh.cablePair.utils.sameConnector(self)) {
    dh.cablePair.utils.cancelConnection(startConnector);
    return;
  }

  // Do not allow connections on the same side.
  if (dh.cablePair.utils.sameSide(currentNode)) {
    ctrl.butterBar.sendMessage(
        'Strand creation is not allowed between connectors on the same side.',
        jfk.ButterBar.Type.INFO, 3000);
    ctrl.scope.$apply();
    return;
  }

  var x = d3.event.offsetX;
  var y = d3.event.offsetY;

  // Set to center of connector.
  y = y - Math.floor(d3.mouse(self)[1]) + 10;

  var isConnected = self.getAttribute(
      dh.cablePair.utils.ATTR_CONNECTED) == 'true';

  if (!isConnected) {
    if (!startConnector) {
      // Begin a new strand connection.
      dh.cablePair.utils.startConnector_ = self;
      currentNode[0][0]['__data__'].x1 = x;
      currentNode[0][0]['__data__'].y1 = y;
      currentNode.classed('begin-flash', true);
      dh.cablePair.utils.showStrandCreationBanner(ctrl);
      dh.cablePair.utils.drawDanglingStrand(self, ctrl);
    } else if (startConnector !== null) {
      // Complete an existing strand connection.
      dh.cablePair.utils.removeDanglingStrandBoxes();
      var aConnector = d3.select(startConnector);
      // Draw connecting line.
      var x1 = aConnector[0][0]['__data__'].x1;
      var y1 = aConnector[0][0]['__data__'].y1;

      // Find center of a connector.
      if (!isLeft) {
        offset = (Math.floor(svgWidth) - x) % 10;
        x = (offset >= 5) ? x + (offset - 5) : x - (5 - offset);
      }
      else {
        offset = x % 10;
        var z = Math.floor(x / 5) * 5;
        x = (offset < 5) ? z + 5 : z;
      }

      // Find a mid point in the strand to draw handle.
      var mx = x1 + 0.5 * (x - x1);
      var my = y1 + 0.5 * (y - y1);

      var strandObject = dh.cablePair.utils.newStrandObject(self, ctrl);
      var strandGroup = dh.cablePair.utils.newStrandGroup(self, ctrl);

      strandGroup.append('line').
          attr('x1', x1).
          attr('y1', y1).
          attr('x2', mx).
          attr('y2', my).
          attr('class', dh.cablePair.utils.STRAND_LINE_CLASS).
          attr('isLeft', (!isLeft).toString()).
          transition().duration(500).style('opacity', 1);
      strandGroup.append('line').
          attr('x1', x).
          attr('y1', y).
          attr('x2', mx).
          attr('y2', my).
          attr('class', dh.cablePair.utils.STRAND_LINE_CLASS).
          attr('isLeft', isLeft.toString()).
          transition().duration(500).style('opacity', 1);

      isLeft ?
          dh.cablePair.utils.drawStrandCheckbox(x, y, mx, my, strandGroup) :
          dh.cablePair.utils.drawStrandCheckbox(x1, y1, mx, my, strandGroup);

      strandGroup.append('circle').
          attr('cx', x1).
          attr('cy', y1).
          attr('r', dh.cablePair.utils.STRAND_END_CIRCLE_RADIUS).
          attr('class', dh.cablePair.utils.STRAND_END_CIRCLE_CLASS);
      strandGroup.append('circle').
          attr('cx', x).
          attr('cy', y).
          attr('r', dh.cablePair.utils.STRAND_END_CIRCLE_RADIUS).
          attr('class', dh.cablePair.utils.STRAND_END_CIRCLE_CLASS);
      strandGroup.append('circle').
          attr('cx', mx).
          attr('cy', my).
          attr('r', dh.cablePair.utils.STRAND_MIDDLE_CIRCLE_RADIUS).
          attr('class', dh.cablePair.utils.STRAND_MIDDLE_CIRCLE_CLASS).
          on('click', function() {
            ctrl.scope.$parent.selectedStrand = strandGroup;
            dh.cablePair.utils.showStrandMenu_(ctrl, strandObject);
            ctrl.scope.$apply();
          }).
          on('mousedown', function() {
            dh.cablePair.utils.makeStrandDraggable(ctrl, strandObject);
          });

      d3.select(dh.cablePair.utils.startConnector_).
          classed('begin-flash', false);
      d3.select('.cable-pair-status-message').text('');

      dh.cablePair.utils.setConnectedStatus([aConnector, currentNode]);
      dh.cablePair.utils.resetStartConnector();
      /* Save the strand object to application memory */
      ctrl.cablePair.saveStrandToStrands(strandObject);
    }
  } else {
    ctrl.butterBar.sendMessage(
        'Connector is not available. Strand creation is not possible.',
        jfk.ButterBar.Type.INFO, 3000);
    ctrl.scope.$apply();
  }
};


/**
 * Draws a checkbox for selection of strands.
 * @param {number} x The x coordinate of left side connector.
 * @param {number} y The y coordinate of left side connector.
 * @param {number} mx The x coordinate of center point of a strand.
 * @param {number} my The y coordinate of center point of a strand.
 * @param {D3Type|Function} strandGroup The group element of a strand.
 * @param {boolean=} opt_drawCheckMark Indicates whether to draw a checkmark.
 */
dh.cablePair.utils.drawStrandCheckbox = function(
    x, y, mx, my, strandGroup, opt_drawCheckMark) {
  var checkboxX = x + 0.1 * (mx - x);
  var checkboxY = y + 0.1 * (my - y);
  var checkboxGroup = strandGroup.append('g');

  checkboxGroup.on('click', function() {
    dh.cablePair.utils.drawCheckMark(d3.event.target, checkboxGroup);
  });
  var checkbox = checkboxGroup.append('rect').
      attr('x', checkboxX - 7).
      attr('y', checkboxY - 7).
      attr('width', 15).
      attr('height', 15).
      attr('fill', 'white').
      attr('stroke', 'black');
  if (opt_drawCheckMark) {
    dh.cablePair.utils.drawCheckMark(checkbox[0][0], checkboxGroup);
  }
};


/**
 * Draws a YCable from selected strands.
 * @return {boolean} Indicates success of YCable creation.
 */
dh.cablePair.utils.drawYCable = function() {
  var x1Array = [];
  var y1Array = [];
  var strandSelected;

  d3.selectAll('.cable-pair-strand').filter(function() {
    if (d3.select(this).select('g').select('rect').attr('checked') == 'true') {
      strandSelected = true;
      d3.select(this).selectAll('line').call(function() {
        x1Array.push(parseInt(this[0][0].getAttribute('x1'), 10),
                     parseInt(this[0][1].getAttribute('x1'), 10));
        y1Array.push(parseInt(this[0][0].getAttribute('y1'), 10),
                     parseInt(this[0][1].getAttribute('y1'), 10));
      });
    }
  });
  if (!strandSelected) {
    return false;
  }

  var sortNumbers = function(firstNum, secondNum) {
    return firstNum - secondNum;
  };
  x1Array.sort(sortNumbers);
  y1Array.sort(sortNumbers);

  // Find a point to draw ycable's center.
  var length = x1Array.length;
  var mx = x1Array[length - 1] + 0.5 * (x1Array[0] - x1Array[length - 1]);
  length = y1Array.length;
  var my = y1Array[length - 1] + 0.5 * (y1Array[0] - y1Array[length - 1]);

  var yCableGroup = d3.select('.cable-pair-svg-container').append('g').
      attr('class', 'ycable-group');
  d3.selectAll('.cable-pair-strand').filter(function() {
    if (d3.select(this).select('g').select('rect').attr('checked') == 'true') {
      d3.select(this).selectAll('line').
          call(dh.cablePair.utils.drawYCableLinks, mx, my, yCableGroup);
      // Remove strands and clean up.
      d3.select(this).remove();
    }
  });

  yCableGroup.append('circle').
      attr('cx', mx).
      attr('cy', my).
      attr('r', 10).
      attr('class', 'ycable-center-circle');
  return true;
};


/**
 * Draws individual links for YCable.
 * @param {D3Type|Function} selection The lines of a strand.
 * @param {number} mx The x coordinate of center point of a strand.
 * @param {number} my The y coordinate of center point of a strand.
 * @param {D3Type|Function} yCableGroup The group element of a YCable.
 */
dh.cablePair.utils.drawYCableLinks = function(selection, mx, my, yCableGroup) {
  var x1 = parseInt(selection[0][0].getAttribute('x1'), 10);
  var y1 = parseInt(selection[0][0].getAttribute('y1'), 10);
  var linkGroup = yCableGroup.append('g');
  var diagonal;
  var drawLink = function(x1, y1) {
    diagonal = d3.svg.diagonal().source({'x': x1, 'y': y1}).
        target({'x': mx, 'y': my});
    linkGroup.append('path').
        attr('class', 'ycable-link').
        attr('d', diagonal);
    linkGroup.append('circle').
        attr('cx', x1).
        attr('cy', y1).
        attr('r', 2).
        attr('class', 'strand-end-circle');
  };

  drawLink(x1, y1);
  x1 = parseInt(selection[0][1].getAttribute('x1'), 10);
  y1 = parseInt(selection[0][1].getAttribute('y1'), 10);
  drawLink(x1, y1);

  linkGroup.on('mouseover', function() {
    d3.select(this).selectAll('path').classed('ycable-link-hover', true);
  }).on('mouseout', function() {
    d3.select(this).selectAll('path').classed('ycable-link-hover', false);
  });
};


/**
 * Draws a check mark inside a checkbox.
 * @param {Node} eventTarget The node that triggered the event.
 * @param {D3Type|Function} checkboxGroup The group element of checkbox.
 */
dh.cablePair.utils.drawCheckMark = function(eventTarget, checkboxGroup) {
  var target = d3.select(eventTarget);
  var parent = target[0][0].parentNode;

  if (target.attr('x')) {
    if (target.attr('checked') != 'true') {
      var x = parseInt(target.attr('x'), 10);
      var y = parseInt(target.attr('y'), 10);
      var pathData = 'M ' + (x + 3) + ' ' + (y + 8) + ' L ' +
          (x + 7) + ' ' + (y + 12) + ' L ' + (x + 13) + ' ' + (y + 3);

      checkboxGroup.append('path').
          attr('d', pathData).
          attr('class', 'check-mark-path');
      target.attr('checked', 'true');
    } else {
      d3.select(parent).select('path').on('click', null).remove();
      target.attr('checked', 'false');
    }
  } else {
    d3.select(parent).select('rect').attr('checked', 'false');
    target.on('click', null).remove();
  }
};


/**
 * Adds dragging functionality to strands.
 * @param {dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 * @param {json.Strand} strandObject The selected strand object.
 */
dh.cablePair.utils.makeStrandDraggable = function(ctrl, strandObject) {
  var strandCircle = d3.event.target;
  var containerDiv =
      d3.select('.cable-pair-svg-container')[0][0].parentElement;
  var strandGroup = d3.select(d3.select(strandCircle)[0][0].parentElement);
  var checkboxSelected =
      strandGroup.select('g').select('path')[0][0] ? true : false;
  var mx, my, x, y;

  d3.select(containerDiv).on('mousemove', function() {
    mx = d3.event.offsetX;
    my = d3.event.offsetY;
    strandGroup.select('g').on('click', null).remove();
    strandGroup.selectAll('line').filter(function() {
      d3.select(this).attr('x2', mx).attr('y2', my);
      if (d3.select(this).attr('isLeft') == 'true') {
        x = parseInt(d3.select(this).attr('x1'), 10);
        y = parseInt(d3.select(this).attr('y1'), 10);
      }
    });
    dh.cablePair.utils.drawStrandCheckbox(
        x, y, mx, my, strandGroup, checkboxSelected);
    d3.select(strandCircle).attr('cx', d3.event.offsetX).
        attr('cy', d3.event.offsetY);
    d3.select(strandCircle).on('click', null);
  });

  d3.select(containerDiv).on('mouseup', function() {
    d3.select(containerDiv).on('mousemove', null);
    d3.select(strandCircle).on('mouseout', function() {
      d3.select(strandCircle).on('click', function() {
        d3.select(strandCircle).on('mouseout', null);
        dh.cablePair.utils.showStrandMenu_(ctrl, strandObject);
        ctrl.scope.$apply();
      });
      d3.select(strandCircle).on('mouseout', null);
    });
  });
};


/**
 * Removes a device or sockets from svg canvas.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 * @param {D3Type|Function} groupContainer The svg group element.
 * @param {boolean} isRightEntity Indicates entity is right side entity.
 */
dh.cablePair.utils.removeDeviceOrSockets = function(
    ctrl, groupContainer, isRightEntity) {
  var message = 'Are you sure you want to remove the entity?';
  var safeHtmlMessage = goog.html.SafeHtml.htmlEscape(message);

  // Check for unsaved strands.
  if (ctrl.cablePair.getStrands().length) {
    jfk.googdialog.confirmWithHtmlContent(
        'You have unsaved strands or yCables.', safeHtmlMessage,
        function() {
          ctrl.cablePair.clearStrands();
          isRightEntity ? groupContainer.remove() :
              groupContainer[0][0].innerHTML = '';
          d3.selectAll('.ycable-group').remove();
        }, null);
  } else {
    jfk.googdialog.confirmWithHtmlContent(
        message, goog.html.SafeHtml.EMPTY, function() {
          isRightEntity ? groupContainer.remove() :
              groupContainer[0][0].innerHTML = '';
          d3.selectAll('.ycable-group').remove();
        }, null);
  }
};


/**
 * Displays strand's menu.
 * @param {dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 * @param {json.Strand} strandObject The selected strand object.
 * @private
 */
dh.cablePair.utils.showStrandMenu_ = function(ctrl, strandObject) {
  var menuEl = goog.dom.getElementByClass('cablepair-strand-menu');
  ctrl.scope.menu = {strand: null};

  angular.element(menuEl).
      css('left', (d3.event.pageX + 10) + 'px').
      css('top', (d3.event.pageY - 150) + 'px');
  ctrl.scope.menu.strand = strandObject;
};


/**
 * Set canvas's height.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 */
dh.cablePair.utils.setCanvasHeight = function(ctrl) {
  var rHeight = goog.dom.getElementByClass('right-device-container').
      getBoundingClientRect().height;
  var lHeight = ctrl.scope.leftDeviceHeight;
  var height = (rHeight > lHeight) ? rHeight : lHeight;
  var dropdownHeight = (lHeight > rHeight && lHeight > 445) ? 0 : 445;

  // Add margin and dropdown's height.
  height = height + 40 + dropdownHeight;
  d3.select('.cable-pair-svg-container').attr('height', height);
};


/**
 * Show or hide non-power  and fiber ports.
 * @param {Object<string, boolean>} portVisibility Contains a boolean for each
 *     port type indicating whether to show or hide ports of that type.
 */
dh.cablePair.utils.togglePorts = function(portVisibility) {
  dh.cablePair.utils.showPorts_();

  var showPower = portVisibility.showOnlyPowerPorts;
  var showFiber = portVisibility.showOnlyFiberPorts;

  switch (showPower + '|' + showFiber) {
    case 'true|true':
      dh.cablePair.utils.showOnlyPowerPorts_();
      dh.cablePair.utils.showOnlyFiberPorts_();
      break;
    case 'true|false':
      dh.cablePair.utils.showOnlyPowerPorts_();
      break;
    case 'false|true':
      dh.cablePair.utils.showOnlyFiberPorts_();
      break;
    default:
      /** No selection made, show all ports **/
      dh.cablePair.utils.showPorts_();
  }
};


/**
 * Show all ports.
 * @private
 */
dh.cablePair.utils.showPorts_ = function() {
  d3.selectAll(dh.cablePair.utils.PORT_SELECTOR_).
      style('visibility', 'visible');
};


/**
 * Show only power ports.
 * @private
 */
dh.cablePair.utils.showOnlyPowerPorts_ = function() {
  d3.selectAll(dh.cablePair.utils.NON_POWER_PORT_SELECTOR_).
      style('visibility', 'hidden');
};


/**
 * Show only fiber ports.
 * @private
 */
dh.cablePair.utils.showOnlyFiberPorts_ = function() {
  d3.selectAll(dh.cablePair.utils.NON_FIBER_PORT_SELECTOR_).
      style('visibility', 'hidden');
};


/**
 * Position the right device's selection box.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 */
dh.cablePair.utils.positionRightSelectBox = function(ctrl) {
  var rHeight = d3.select('.right-device-container')[0][0].
      getBoundingClientRect().height;
  var menuEl = goog.dom.getElementByClass('cablepair-select-box');
  angular.element(menuEl).css('top', rHeight + 30 + 'px');
};


/**
 * Gets the Right side Device name and calls the controller.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 */
dh.cablePair.utils.callCtrlToGetRightDevice = function(ctrl) {
  var deviceInput = goog.dom.getElementByClass('cablepair-rightdevice-input');
  var deviceName = angular.element(deviceInput).val();
  ctrl.getDeviceDetails(deviceName);
};


/**
 * Gets the right side rack uuid and calls the controller.
 * @param {!dh.cablePair.CablePairCtrl} ctrl The CablePair controller.
 */
dh.cablePair.utils.callCtrlToGetRightRack = function(ctrl) {
  var rackInput = goog.dom.getElementByClass('cablepair-rightrack-input');
  var rackName = angular.element(rackInput).val();
  ctrl.getRackSockets(rackName);
  angular.element(rackInput).val('');
};


/**
 * The CSS class name of a strand dangling circle.
 * @const {string}
 */
dh.cablePair.utils.DANGLING_STRAND_CIRCLE_CLASS = 'strand-dangling-circle';


/**
 * The circle radius of a dangling strand selector in pixels.
 * @const {number}
 */
dh.cablePair.utils.DANGLING_STRAND_CIRCLE_RADIUS = 8;


/**
 * The CSS class name of a dangling strand's text.
 * @const {string}
 */
dh.cablePair.utils.DANGLING_STRAND_TEXT_CLASS = 'strand-dangling-text';


/**
 * Number of X pixels to offset dangling strands from a connector.
 * @const {number}
 */
dh.cablePair.utils.DANGLING_STRAND_X_OFFSET = 60;


/**
 * The offset of the dangling strand text in X pixels.
 * @const {number}
 */
dh.cablePair.utils.DANGLING_STRAND_TEXT_X_OFFSET = 80;


/**
 * The offset of the dangling strand text in Y pixels.
 * @const {number}
 */
dh.cablePair.utils.DANGLING_STRAND_TEXT_Y_OFFSET = 5;


/**
 * The CSS class name of a strand line.
 * @const {string}
 */
dh.cablePair.utils.STRAND_LINE_CLASS = 'strand-line';


/**
 * The CSS class name of a strand middle circle.
 * @const {string}
 */
dh.cablePair.utils.STRAND_MIDDLE_CIRCLE_CLASS = 'strand-middle-circle';


/**
 * The circle radius of a dangling strand middle in pixels.
 * @const {number}
 */
dh.cablePair.utils.STRAND_MIDDLE_CIRCLE_RADIUS = 8;


/**
 * The CSS class name of a strand end circle.
 * @const {string}
 */
dh.cablePair.utils.STRAND_END_CIRCLE_CLASS = 'strand-end-circle';


/**
 * The circle radius of a dangling strand end in pixels.
 * @const {number}
 */
dh.cablePair.utils.STRAND_END_CIRCLE_RADIUS = 2;


/**
 * Number of default connectors of a port.
 * @const {number}
 */
dh.cablePair.utils.DEFAULT_CONNECTORS = 2;


/**
 * The name of the HTML element attribute that clarifies if a port is connected.
 * @const {string}.
 */
dh.cablePair.utils.ATTR_CONNECTED = 'dh-is-connected';


/**
 * The CSS class that belongs to all ports.
 * @const {string}
 * @private
 */
dh.cablePair.utils.PORT_SELECTOR_ = '.port';


/**
 * The CSS class that belongs to non power ports.
 * @const {string}
 * @private
 */
dh.cablePair.utils.NON_POWER_PORT_SELECTOR_ = '.non-power-port';


/**
 * The CSS class that belongs to non fiber ports.
 * @const {string}
 * @private
 */
dh.cablePair.utils.NON_FIBER_PORT_SELECTOR_ = '.non-fiber-port';


/**
 * The CSS class that belongs to power ports.
 * @const {string}
 * @private
 */
dh.cablePair.utils.POWER_PORT_CLASS_ = 'port-power';


/**
 * The CSS class that belongs to fiber ports.
 * @const {string}
 * @private
 */
dh.cablePair.utils.FIBER_PORT_CLASS_ = 'port-fiber';
