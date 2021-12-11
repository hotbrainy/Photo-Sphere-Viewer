/*!
* Photo Sphere Viewer 4.4.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2021 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('photo-sphere-viewer'), require('three')) :
  typeof define === 'function' && define.amd ? define(['exports', 'photo-sphere-viewer', 'three'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.VirtualTourPlugin = {}), global.PhotoSphereViewer, global.THREE));
})(this, (function (exports, photoSphereViewer, THREE) { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  /**
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @package
   */

  var AbstractDatasource = /*#__PURE__*/function () {
    /**
     * @type {Record<string, PSV.plugins.VirtualTourPlugin.Node>}
     */

    /**
     * @param {PSV.plugins.VirtualTourPlugin} plugin
     */
    function AbstractDatasource(plugin) {
      this.nodes = {};
      this.plugin = plugin;
    }

    var _proto = AbstractDatasource.prototype;

    _proto.destroy = function destroy() {
      delete this.plugin;
    }
    /**
     * @summary Loads a node
     * @param {string} nodeId
     * @return {Promise<PSV.plugins.VirtualTourPlugin.Node>}
     */
    ;

    _proto.loadNode = function loadNode(nodeId) {
      // eslint-disable-line no-unused-vars
      throw new photoSphereViewer.PSVError('loadNode not implemented');
    }
    /**
     * @summary Loades nodes linked to another node
     * @param {string} nodeId
     * @return {Promise<void>}
     */
    ;

    _proto.loadLinkedNodes = function loadLinkedNodes(nodeId) {
      // eslint-disable-line no-unused-vars
      throw new photoSphereViewer.PSVError('loadLinkedNodes not implemented');
    };

    return AbstractDatasource;
  }();

  /**
   * @summary Checks the configuration of a node
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @param {boolean} isGps
   * @private
   */

  function checkNode(node, isGps) {
    var _node$position;

    if (!node.id) {
      throw new photoSphereViewer.PSVError('No id given for node');
    }

    if (!node.panorama) {
      throw new photoSphereViewer.PSVError("No panorama provided for node " + node.id);
    }

    if (isGps && !(((_node$position = node.position) == null ? void 0 : _node$position.length) >= 2)) {
      throw new photoSphereViewer.PSVError("No position provided for node " + node.id);
    }
  }
  /**
   * @summary Checks the configuration of a link
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
   * @param {boolean} isGps
   * @private
   */

  function checkLink(node, link, isGps) {
    if (!link.nodeId) {
      throw new photoSphereViewer.PSVError("Link of node " + node.id + " has no target id");
    }

    if (!isGps && !photoSphereViewer.utils.isExtendedPosition(link)) {
      throw new photoSphereViewer.PSVError("No position provided for link " + link.nodeId + " of node " + node.id);
    }
  }
  /**
   * @summary Changes the color of a mesh
   * @param {external:THREE.Mesh} mesh
   * @param {*} color
   * @private
   */

  function setMeshColor(mesh, color) {
    mesh.material.color.set(color);
    mesh.material.emissive.set(color);
  }
  /**
   * @summary Returns the distance between two GPS points
   * @param {number[]} p1
   * @param {number[]} p2
   * @return {number}
   * @private
   */

  function distance(p1, p2) {
    return photoSphereViewer.utils.greatArcDistance(p1, p2) * 6371e3;
  }
  /**
   * @summary Returns the bearing between two GPS points
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   * @param {number[]} p1
   * @param {number[]} p2
   * @return {number}
   * @private
   */

  function bearing(p1, p2) {
    var λ1 = p1[0],
        φ1 = p1[1];
    var λ2 = p2[0],
        φ2 = p2[1];
    var y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    var x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    return Math.atan2(y, x);
  }

  /**
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @package
   */

  var ClientSideDatasource = /*#__PURE__*/function (_AbstractDatasource) {
    _inheritsLoose(ClientSideDatasource, _AbstractDatasource);

    function ClientSideDatasource() {
      return _AbstractDatasource.apply(this, arguments) || this;
    }

    var _proto = ClientSideDatasource.prototype;

    _proto.loadNode = function loadNode(nodeId) {
      if (this.nodes[nodeId]) {
        return Promise.resolve(this.nodes[nodeId]);
      } else {
        return Promise.reject(new photoSphereViewer.PSVError("Node " + nodeId + " not found"));
      }
    };

    _proto.loadLinkedNodes = function loadLinkedNodes(nodeId) {
      if (!this.nodes[nodeId]) {
        return Promise.reject(new photoSphereViewer.PSVError("Node " + nodeId + " not found"));
      } else {
        return Promise.resolve();
      }
    };

    _proto.setNodes = function setNodes(rawNodes) {
      var _this = this;

      if (!(rawNodes != null && rawNodes.length)) {
        throw new photoSphereViewer.PSVError('No nodes provided');
      }

      var nodes = {};
      var linkedNodes = {};
      rawNodes.forEach(function (node) {
        checkNode(node, _this.plugin.isGps());

        if (nodes[node.id]) {
          throw new photoSphereViewer.PSVError("Duplicate node " + node.id);
        }

        if (!node.links) {
          photoSphereViewer.utils.logWarn("Node " + node.id + " has no links");
          nodes.links = [];
        }

        nodes[node.id] = node;
      });
      rawNodes.forEach(function (node) {
        node.links.forEach(function (link) {
          checkLink(node, link, _this.plugin.isGps());

          if (!nodes[link.nodeId]) {
            throw new photoSphereViewer.PSVError("Target node " + link.nodeId + " of node " + node.id + " does not exists");
          } // copy essential data


          link.position = link.position || nodes[link.nodeId].position;
          link.name = link.name || nodes[link.nodeId].name;
          linkedNodes[link.nodeId] = true;
        });
      });
      rawNodes.forEach(function (node) {
        if (!linkedNodes[node.id]) {
          photoSphereViewer.utils.logWarn("Node " + node.id + " is never linked to");
        }
      });
      this.nodes = nodes;
    };

    return ClientSideDatasource;
  }(AbstractDatasource);

  var metadata={version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"};var uuid="B5839B4F-7D11-4EC3-B454-059BC0185A1B";var type="BufferGeometry";var data={attributes:{position:{itemSize:3,type:"Float32Array",array:[50,0,25,50,20,25,0,10,50,50,0,25,100,10,50,50,20,25,50,10,0,0,10,50,50,20,25,100,10,50,50,10,0,50,20,25,50,0,25,0,10,50,50,10,0,50,10,0,100,10,50,50,0,25],normalized:false},normal:{itemSize:3,type:"Float32Array",array:[0.447214,0,0.894427,0.447214,0,0.894427,0.447214,0,0.894427,-0.447214,0,0.894427,-0.447214,0,0.894427,-0.447214,0,0.894427,-0.348155,0.870388,-0.348155,-0.348155,0.870388,-0.348155,-0.348155,0.870388,-0.348155,0.348155,0.870388,-0.348155,0.348155,0.870388,-0.348155,0.348155,0.870388,-0.348155,-0.348155,-0.870388,-0.348155,-0.348155,-0.870388,-0.348155,-0.348155,-0.870388,-0.348155,0.348155,-0.870388,-0.348155,0.348155,-0.870388,-0.348155,0.348155,-0.870388,-0.348155],normalized:false}},boundingSphere:{center:[50,10,25],radius:55.901699}};var arrowGeometryJson = {metadata:metadata,uuid:uuid,type:type,data:data};

  var arrowIconSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 210 210\" x=\"0px\" y=\"0px\"><path fill=\"currentColor\" transform=\"translate(0 10)\" d=\"M0 181l105 -181 105 181 -105 -61 -105 61zm105 -167l0 99 86 50 -86 -148z\"/><!-- Created by Saifurrijal from the Noun Project --></svg>\n";

  /**
   * @summary In client mode all the nodes are provided in the config or with the `setNodes` method
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_CLIENT = 'client';
  /**
   * @summary In server mode the nodes are fetched asynchronously
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_SERVER = 'server';
  /**
   * @summary In manual mode each link is positionned manually on the panorama
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_MANUAL = 'manual';
  /**
   * @summary In GPS mode each node is globally positionned and the links are automatically computed
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_GPS = 'gps';
  /**
   * @summaru In markers mode the links are represented using markers
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_MARKERS = 'markers';
  /**
   * @summaru In 3D mode the links are represented using 3d arrows
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_3D = '3d';
  /**
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var EVENTS = {
    /**
     * @event node-changed
     * @memberof PSV.plugins.VirtualTourPlugin
     * @summary Triggered when the current node changes
     * @param {string} nodeId
     */
    NODE_CHANGED: 'node-changed'
  };
  /**
   * @summary Property name added to markers
   * @type {string}
   * @constant
   * @private
   */

  var LINK_DATA = 'tourLink';
  /**
   * @summary Default style of the link marker
   * @type {PSV.plugins.MarkersPlugin.Properties}
   * @constant
   * @private
   */

  var DEFAULT_MARKER = {
    html: arrowIconSvg,
    width: 80,
    height: 80,
    scale: [0.5, 2],
    anchor: 'top center',
    className: 'psv-virtual-tour__marker',
    style: {
      color: 'rgba(0, 208, 255, 0.8)'
    }
  };
  /**
   * @summary Default style of the link arrow
   * @type {PSV.plugins.VirtualTourPlugin.ArrowStyle}
   * @constant
   * @private
   */

  var DEFAULT_ARROW = {
    color: 0x0055aa,
    hoverColor: 0xaa5500,
    opacity: 0.8,
    scale: [0.5, 2]
  };
  /**
   * @type {external:THREE.BufferedGeometry}
   * @constant
   * @private
   */

  var ARROW_GEOM = function () {
    var loader = new THREE.ObjectLoader();
    var geom = loader.parseGeometries([arrowGeometryJson])[arrowGeometryJson.uuid];
    geom.scale(0.01, 0.015, 0.015);
    geom.computeBoundingBox();
    var b = geom.boundingBox;
    geom.translate(-(b.max.x - b.min.y) / 2, -(b.max.y - b.min.y) / 2, -(b.max.z - b.min.z) / 2);
    geom.rotateX(Math.PI);
    return geom;
  }();

  /**
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @package
   */

  var ServerSideDatasource = /*#__PURE__*/function (_AbstractDatasource) {
    _inheritsLoose(ServerSideDatasource, _AbstractDatasource);

    function ServerSideDatasource(plugin) {
      var _this;

      _this = _AbstractDatasource.call(this, plugin) || this;

      if (!plugin.config.getNode || !plugin.config.getLinks) {
        throw new photoSphereViewer.PSVError('Missing getNode() and/or getLinks() options.');
      }

      _this.nodeResolver = plugin.config.getNode;
      _this.linksResolver = plugin.config.getLinks;
      return _this;
    }

    var _proto = ServerSideDatasource.prototype;

    _proto.loadNode = function loadNode(nodeId) {
      var _this2 = this;

      if (this.nodes[nodeId]) {
        return Promise.resolve(this.nodes[nodeId]);
      } else {
        return Promise.resolve(this.nodeResolver(nodeId)).then(function (node) {
          checkNode(node, _this2.plugin.isGps());
          _this2.nodes[nodeId] = node;
          return node;
        });
      }
    };

    _proto.loadLinkedNodes = function loadLinkedNodes(nodeId) {
      var _this3 = this;

      if (!this.nodes[nodeId]) {
        return Promise.reject(new photoSphereViewer.PSVError("Node " + nodeId + " not found"));
      } else if (this.nodes[nodeId].links) {
        return Promise.resolve();
      } else {
        return Promise.resolve(this.linksResolver(nodeId)).then(function (links) {
          return links || [];
        }).then(function (links) {
          var node = _this3.nodes[nodeId];
          links.forEach(function (link) {
            checkLink(node, link, _this3.plugin.isGps()); // copy essential data

            if (_this3.nodes[link.nodeId]) {
              link.position = link.position || _this3.nodes[link.nodeId].position;
              link.name = link.name || _this3.nodes[link.nodeId].name;
            }

            if (_this3.plugin.isGps() && !link.position) {
              throw new photoSphereViewer.PSVError("No GPS position provided for link " + link.nodeId + " of node " + node.id);
            }
          }); // store links

          node.links = links;
        });
      }
    };

    return ServerSideDatasource;
  }(AbstractDatasource);

  /**
   * @callback GetNode
   * @summary Function to load a node
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @param {string} nodeId
   * @returns {PSV.plugins.VirtualTourPlugin.Node|Promise<PSV.plugins.VirtualTourPlugin.Node>}
   */

  /**
   * @callback GetLinks
   * @summary Function to load the links of a node
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @param {string} nodeId
   * @returns {PSV.plugins.VirtualTourPlugin.NodeLink[]|Promise<PSV.plugins.VirtualTourPlugin.NodeLink[]>}
   */

  /**
   * @callback Preload
   * @summary Function to determine if a link must be preloaded
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
   * @returns {boolean}
   */

  /**
   * @typedef {Object} PSV.plugins.VirtualTourPlugin.Node
   * @summary Definition of a single node in the tour
   * @property {string} id - unique identifier of the node
   * @property {*} panorama
   * @property {PSV.plugins.VirtualTourPlugin.NodeLink[]} [links] - links to other nodes
   * @property {number[]} [position] - GPS position (longitude, latitude, optional altitude)
   * @property {PSV.PanoData | PSV.PanoDataProvider} [panoData] - data used for this panorama
   * @property {PSV.SphereCorrection} [sphereCorrection] - sphere correction to apply to this panorama
   * @property {string} [name] - short name of the node
   * @property {string} [caption] - caption visible in the navbar
   * @property {PSV.plugins.MarkersPlugin.Properties[]} [markers] - additional markers to use on this node
   */

  /**
   * @typedef {PSV.ExtendedPosition} PSV.plugins.VirtualTourPlugin.NodeLink
   * @summary Definition of a link between two nodes
   * @property {string} nodeId - identifier of the target node
   * @property {string} [name] - override the name of the node (tooltip)
   * @property {number[]} [position] - override the GPS position of the node
   * @property {PSV.plugins.MarkersPlugin.Properties} [markerStyle] - override global marker style
   * @property {PSV.plugins.VirtualTourPlugin.ArrowStyle} [arrowStyle] - override global arrow style
   */

  /**
   * @typedef {Object} PSV.plugins.VirtualTourPlugin.ArrowStyle
   * @summary Style of the arrow in 3D mode
   * @property {string} [color=#0055aa]
   * @property {string} [hoverColor=#aa5500]
   * @property {number} [opacity=0.8]
   * @property {number[]} [scale=[0.5,2]]
   */

  /**
   * @typedef {Object} PSV.plugins.VirtualTourPlugin.Options
   * @property {'client'|'server'} [dataMode='client'] - configure data mode
   * @property {'manual'|'gps'} [positionMode='manual'] - configure positioning mode
   * @property {'markers'|'3d'} [renderMode='3d'] - configure rendering mode of links
   * @property {PSV.plugins.VirtualTourPlugin.Node[]} [nodes] - initial nodes
   * @property {PSV.plugins.VirtualTourPlugin.GetNode} [getNode]
   * @property {PSV.plugins.VirtualTourPlugin.GetLinks} [getLinks]
   * @property {string} [startNodeId] - id of the initial node, if not defined the first node will be used
   * @property {boolean|PSV.plugins.VirtualTourPlugin.Preload} [preload=false] - preload linked panoramas
   * @property {PSV.plugins.MarkersPlugin.Properties} [markerStyle] - global marker style
   * @property {PSV.plugins.VirtualTourPlugin.ArrowStyle} [arrowStyle] - global arrow style
   * @property {number} [markerLatOffset=-0.1] - (GPS & Markers mode) latitude offset applied to link markers, to compensate for viewer height
   * @property {'top'|'bottom'} [arrowPosition='bottom'] - (3D mode) arrows vertical position
   * @property {boolean} [linksOnCompass] - if the Compass plugin is enabled, displays the links on the compass
   */

  photoSphereViewer.DEFAULTS.lang.loading = 'Loading...';
  /**
   * @summary Create virtual tours by linking multiple panoramas
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var VirtualTourPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(VirtualTourPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.VirtualTourPlugin.Options} [options]
     */
    function VirtualTourPlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @member {Object}
       * @property {PSV.plugins.VirtualTourPlugin.Node} currentNode
       * @property {external:THREE.Mesh} currentArrow
       * @property {PSV.Tooltip} currentTooltip
       * @private
       */

      _this.prop = {
        currentNode: null,
        currentArrow: null,
        currentTooltip: null
      };
      /**
       * @type {Record<string, boolean | Promise>}
       * @private
       */

      _this.preload = {};
      /**
       * @member {PSV.plugins.VirtualTourPlugin.Options}
       * @private
       */

      _this.config = _extends({
        dataMode: MODE_CLIENT,
        positionMode: MODE_MANUAL,
        renderMode: MODE_3D,
        preload: false,
        markerLatOffset: -0.1,
        arrowPosition: 'bottom',
        linksOnCompass: (options == null ? void 0 : options.renderMode) === MODE_MARKERS
      }, options, {
        markerStyle: _extends({}, DEFAULT_MARKER, options == null ? void 0 : options.markerStyle),
        arrowStyle: _extends({}, DEFAULT_ARROW, options == null ? void 0 : options.arrowStyle),
        nodes: null
      });
      /**
       * @type {PSV.plugins.MarkersPlugin}
       * @private
       */

      _this.markers = _this.psv.getPlugin('markers');
      /**
       * @type {PSV.plugins.CompassPlugin}
       * @private
       */

      _this.compass = _this.psv.getPlugin('compass');

      if (!_this.is3D() && !_this.markers) {
        throw new photoSphereViewer.PSVError('Tour plugin requires the Markers plugin in markers mode');
      }
      /**
       * @type {PSV.plugins.VirtualTourPlugin.AbstractDatasource}
       */


      _this.datasource = _this.isServerSide() ? new ServerSideDatasource(_assertThisInitialized(_this)) : new ClientSideDatasource(_assertThisInitialized(_this));
      /**
       * @type {external:THREE.Group}
       * @private
       */

      _this.arrowsGroup = null;

      if (_this.is3D()) {
        _this.arrowsGroup = new THREE.Group();
        var localLight = new THREE.PointLight(0xffffff, 1, 0);
        localLight.position.set(2, 0, 0);

        _this.arrowsGroup.add(localLight);

        _this.psv.once(photoSphereViewer.CONSTANTS.EVENTS.READY, function () {
          _this.__positionArrows();

          _this.psv.renderer.scene.add(_this.arrowsGroup);

          var ambientLight = new THREE.AmbientLight(0xffffff, 1);

          _this.psv.renderer.scene.add(ambientLight);

          _this.psv.needsUpdate();

          _this.psv.container.addEventListener('mousemove', _assertThisInitialized(_this));
        });

        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, _assertThisInitialized(_this));

        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, _assertThisInitialized(_this));

        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.CLICK, _assertThisInitialized(_this));
      } else {
        _this.markers.on('select-marker', _assertThisInitialized(_this));
      }

      if (_this.isServerSide()) {
        if (_this.config.startNodeId) {
          _this.setCurrentNode(_this.config.startNodeId);
        }
      } else if (options != null && options.nodes) {
        _this.setNodes(options.nodes, _this.config.startNodeId);
      }

      return _this;
    }

    var _proto = VirtualTourPlugin.prototype;

    _proto.destroy = function destroy() {
      if (this.markers) {
        this.markers.off('select-marker', this);
      }

      if (this.arrowsGroup) {
        this.psv.renderer.scene.remove(this.arrowsGroup);
      }

      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
      this.psv.container.removeEventListener('mousemove', this);
      this.datasource.destroy();
      delete this.preload;
      delete this.datasource;
      delete this.markers;
      delete this.prop;
      delete this.arrowsGroup;

      _AbstractPlugin.prototype.destroy.call(this);
    };

    _proto.handleEvent = function handleEvent(e) {
      var _e$args$0$data, _e$args$0$data$LINK_D, _this$prop$currentArr, _this$prop$currentArr2, _this$prop$currentArr3;

      var nodeId;

      switch (e.type) {
        case 'select-marker':
          nodeId = (_e$args$0$data = e.args[0].data) == null ? void 0 : (_e$args$0$data$LINK_D = _e$args$0$data[LINK_DATA]) == null ? void 0 : _e$args$0$data$LINK_D.nodeId;

          if (nodeId) {
            this.setCurrentNode(nodeId);
          }

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED:
        case photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED:
          if (this.arrowsGroup) {
            this.__positionArrows();
          }

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.CLICK:
          nodeId = (_this$prop$currentArr = this.prop.currentArrow) == null ? void 0 : (_this$prop$currentArr2 = _this$prop$currentArr.userData) == null ? void 0 : (_this$prop$currentArr3 = _this$prop$currentArr2[LINK_DATA]) == null ? void 0 : _this$prop$currentArr3.nodeId;

          if (!nodeId) {
            var _this$psv$dataHelper$, _arrow$userData, _arrow$userData$LINK_;

            // on touch screens "currentArrow" may be null (no hover state)
            var arrow = (_this$psv$dataHelper$ = this.psv.dataHelper.getIntersection({
              x: e.args[0].viewerX,
              y: e.args[0].viewerY
            }, LINK_DATA)) == null ? void 0 : _this$psv$dataHelper$.object;
            nodeId = arrow == null ? void 0 : (_arrow$userData = arrow.userData) == null ? void 0 : (_arrow$userData$LINK_ = _arrow$userData[LINK_DATA]) == null ? void 0 : _arrow$userData$LINK_.nodeId;
          }

          if (nodeId) {
            this.setCurrentNode(nodeId);
          }

          break;

        case 'mousemove':
          this.__onMouseMove(e);

          break;
      }
    }
    /**
     * @summary Tests if running in server mode
     * @return {boolean}
     */
    ;

    _proto.isServerSide = function isServerSide() {
      return this.config.dataMode === MODE_SERVER;
    }
    /**
     * @summary Tests if running in GPS mode
     * @return {boolean}
     */
    ;

    _proto.isGps = function isGps() {
      return this.config.positionMode === MODE_GPS;
    }
    /**
     * @summary Tests if running in 3D mode
     * @return {boolean}
     */
    ;

    _proto.is3D = function is3D() {
      return this.config.renderMode === MODE_3D;
    }
    /**
     * @summary Sets the nodes (client mode only)
     * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
     * @param {string} [startNodeId]
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    ;

    _proto.setNodes = function setNodes(nodes, startNodeId) {
      if (this.isServerSide()) {
        throw new photoSphereViewer.PSVError('Cannot set nodes in server side mode');
      }

      this.datasource.setNodes(nodes);

      if (!startNodeId) {
        startNodeId = nodes[0].id;
      } else if (!this.datasource.nodes[startNodeId]) {
        startNodeId = nodes[0].id;
        photoSphereViewer.utils.logWarn("startNodeId not found is provided nodes, resetted to " + startNodeId);
      }

      this.setCurrentNode(startNodeId);
    }
    /**
     * @summary Changes the current node
     * @param {string} nodeId
     */
    ;

    _proto.setCurrentNode = function setCurrentNode(nodeId) {
      var _this2 = this;

      this.psv.loader.show();
      this.psv.hideError(); // if this node is already preloading, wait for it

      return Promise.resolve(this.preload[nodeId]).then(function () {
        _this2.psv.textureLoader.abortLoading();

        return _this2.datasource.loadNode(nodeId);
      }).then(function (node) {
        _this2.psv.navbar.setCaption("<em>" + _this2.psv.config.lang.loading + "</em>");

        _this2.prop.currentNode = node;

        if (_this2.prop.currentTooltip) {
          _this2.prop.currentTooltip.hide();

          _this2.prop.currentTooltip = null;
        }

        if (_this2.is3D()) {
          var _this2$arrowsGroup;

          (_this2$arrowsGroup = _this2.arrowsGroup).remove.apply(_this2$arrowsGroup, _this2.arrowsGroup.children.filter(function (o) {
            return o.type === 'Mesh';
          }));

          _this2.prop.currentArrow = null;
        } else {
          _this2.markers.clearMarkers();
        }

        if (_this2.config.linksOnCompass && _this2.compass) {
          _this2.compass.setHotspots(null);
        }

        return Promise.all([_this2.psv.setPanorama(node.panorama, {
          panoData: node.panoData,
          sphereCorrection: node.sphereCorrection
        }) // eslint-disable-next-line prefer-promise-reject-errors
        .catch(function () {
          return Promise.reject(null);
        }), // the error is already displayed by the core
        _this2.datasource.loadLinkedNodes(nodeId)]);
      }).then(function () {
        var node = _this2.prop.currentNode;

        if (node.markers) {
          if (_this2.markers) {
            _this2.markers.setMarkers(node.markers);
          } else {
            photoSphereViewer.utils.logWarn("Node " + node.id + " markers ignored because the plugin is not loaded.");
          }
        }

        _this2.__renderLinks(node);

        _this2.__preload(node);

        _this2.psv.navbar.setCaption(node.caption || _this2.psv.config.caption);
        /**
         * @event node-changed
         * @memberof PSV.plugins.VirtualTourPlugin
         * @summary Triggered when the current node is changed
         * @param {string} nodeId
         */


        _this2.trigger(EVENTS.NODE_CHANGED, nodeId);
      }).catch(function (err) {
        _this2.psv.loader.hide();

        _this2.psv.navbar.setCaption('');

        if (err) {
          _this2.psv.showError(_this2.psv.config.lang.loadError);
        }

        return Promise.reject(err);
      });
    }
    /**
     * @summary Adds the links for the node
     * @param {PSV.plugins.VirtualTourPlugin.Node} node
     * @private
     */
    ;

    _proto.__renderLinks = function __renderLinks(node) {
      var _this3 = this;

      var positions = [];
      node.links.forEach(function (link) {
        var position = _this3.__getLinkPosition(node, link);

        positions.push(position);

        if (_this3.is3D()) {
          var _link$arrowStyle, _link$arrowStyle2, _mesh$userData;

          var arrow = ARROW_GEOM.clone();
          var mat = new THREE.MeshLambertMaterial({
            transparent: true,
            opacity: ((_link$arrowStyle = link.arrowStyle) == null ? void 0 : _link$arrowStyle.opacity) || _this3.config.arrowStyle.opacity
          });
          var mesh = new THREE.Mesh(arrow, mat);
          setMeshColor(mesh, ((_link$arrowStyle2 = link.arrowStyle) == null ? void 0 : _link$arrowStyle2.color) || _this3.config.arrowStyle.color);
          mesh.userData = (_mesh$userData = {}, _mesh$userData[LINK_DATA] = link, _mesh$userData.longitude = position.longitude, _mesh$userData);
          mesh.rotation.order = 'YXZ';
          mesh.rotateY(-position.longitude);

          _this3.psv.dataHelper.sphericalCoordsToVector3({
            longitude: position.longitude,
            latitude: 0
          }, mesh.position).multiplyScalar(1 / photoSphereViewer.CONSTANTS.SPHERE_RADIUS);

          _this3.arrowsGroup.add(mesh);
        } else {
          var _data;

          if (_this3.isGps()) {
            position.latitude += _this3.config.markerLatOffset;
          }

          _this3.markers.addMarker(_extends({}, _this3.config.markerStyle, link.markerStyle, {
            id: "tour-link-" + link.nodeId,
            tooltip: link.name,
            hideList: true,
            data: (_data = {}, _data[LINK_DATA] = link, _data)
          }, position), false);
        }
      });

      if (this.is3D()) {
        this.__positionArrows();
      } else {
        this.markers.renderMarkers();
      }

      if (this.config.linksOnCompass && this.compass) {
        this.compass.setHotspots(positions);
      }
    }
    /**
     * @summary Computes the marker position for a link
     * @param {PSV.plugins.VirtualTourPlugin.Node} node
     * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
     * @return {PSV.Position}
     * @private
     */
    ;

    _proto.__getLinkPosition = function __getLinkPosition(node, link) {
      if (this.isGps()) {
        var p1 = [THREE.Math.degToRad(node.position[0]), THREE.Math.degToRad(node.position[1])];
        var p2 = [THREE.Math.degToRad(link.position[0]), THREE.Math.degToRad(link.position[1])];
        var h1 = node.position[2] !== undefined ? node.position[2] : link.position[2] || 0;
        var h2 = link.position[2] !== undefined ? link.position[2] : node.position[2] || 0;
        var latitude = 0;

        if (h1 !== h2) {
          latitude = Math.atan((h2 - h1) / distance(p1, p2));
        }

        var longitude = bearing(p1, p2);
        return {
          longitude: longitude,
          latitude: latitude
        };
      } else {
        return this.psv.dataHelper.cleanPosition(link);
      }
    }
    /**
     * @summary Updates hovered arrow on mousemove
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(evt) {
      var _this$psv$dataHelper$2;

      var viewerPos = photoSphereViewer.utils.getPosition(this.psv.container);
      var viewerPoint = {
        x: evt.clientX - viewerPos.left,
        y: evt.clientY - viewerPos.top
      };
      var mesh = (_this$psv$dataHelper$2 = this.psv.dataHelper.getIntersection(viewerPoint, LINK_DATA)) == null ? void 0 : _this$psv$dataHelper$2.object;

      if (mesh === this.prop.currentArrow) {
        if (this.prop.currentTooltip) {
          this.prop.currentTooltip.move({
            left: viewerPoint.x,
            top: viewerPoint.y
          });
        }
      } else {
        if (this.prop.currentArrow) {
          var _link$arrowStyle3;

          var link = this.prop.currentArrow.userData[LINK_DATA];
          setMeshColor(this.prop.currentArrow, ((_link$arrowStyle3 = link.arrowStyle) == null ? void 0 : _link$arrowStyle3.color) || this.config.arrowStyle.color);

          if (this.prop.currentTooltip) {
            this.prop.currentTooltip.hide();
            this.prop.currentTooltip = null;
          }
        }

        if (mesh) {
          var _link$arrowStyle4;

          var _link = mesh.userData[LINK_DATA];
          setMeshColor(mesh, ((_link$arrowStyle4 = _link.arrowStyle) == null ? void 0 : _link$arrowStyle4.hoverColor) || this.config.arrowStyle.hoverColor);

          if (_link.name) {
            this.prop.currentTooltip = this.psv.tooltip.create({
              left: viewerPoint.x,
              top: viewerPoint.y,
              content: _link.name
            });
          }
        }

        this.prop.currentArrow = mesh;
        this.psv.needsUpdate();
      }
    }
    /**
     * @summary Updates to position of the group of arrows
     * @private
     */
    ;

    _proto.__positionArrows = function __positionArrows() {
      var isBottom = this.config.arrowPosition === 'bottom';
      this.arrowsGroup.position.copy(this.psv.prop.direction).multiplyScalar(0.5);
      var s = this.config.arrowStyle.scale;
      var f = s[1] + (s[0] - s[1]) * photoSphereViewer.CONSTANTS.EASINGS.linear(this.psv.getZoomLevel() / 100);
      this.arrowsGroup.position.y += isBottom ? -1.5 : 1.5;
      this.arrowsGroup.scale.set(f, f, f); // slightly rotates each arrow to make the center ones standing out

      var position = this.psv.getPosition();

      if (isBottom ? position.latitude < Math.PI / 8 : position.latitude > -Math.PI / 8) {
        this.arrowsGroup.children.filter(function (o) {
          return o.type === 'Mesh';
        }).forEach(function (arrow) {
          var d = Math.abs(photoSphereViewer.utils.getShortestArc(arrow.userData.longitude, position.longitude));
          var x = photoSphereViewer.CONSTANTS.EASINGS.inOutSine(Math.max(0, Math.PI / 4 - d) / (Math.PI / 4)) / 3; // magic !

          arrow.rotation.x = isBottom ? -x : x;
        });
      } else {
        this.arrowsGroup.children.filter(function (o) {
          return o.type === 'Mesh';
        }).forEach(function (arrow) {
          arrow.rotation.x = 0;
        });
      }
    }
    /**
     * @summary Manage the preload of the linked panoramas
     * @param {PSV.plugins.VirtualTourPlugin.Node} node
     * @private
     */
    ;

    _proto.__preload = function __preload(node) {
      var _this4 = this;

      if (!this.config.preload || !this.isServerSide()) {
        return;
      }

      this.preload[node.id] = true;
      this.prop.currentNode.links.filter(function (link) {
        return !_this4.preload[link.nodeId];
      }).filter(function (link) {
        if (typeof _this4.config.preload === 'function') {
          return _this4.config.preload(_this4.prop.currentNode, link);
        } else {
          return true;
        }
      }).forEach(function (link) {
        _this4.preload[link.nodeId] = _this4.datasource.loadNode(link.nodeId).then(function (linkNode) {
          return _this4.psv.textureLoader.preloadPanorama(linkNode.panorama);
        }).then(function () {
          _this4.preload[link.nodeId] = true;
        }).catch(function () {
          delete _this4.preload[link.nodeId];
        });
      });
    };

    return VirtualTourPlugin;
  }(photoSphereViewer.AbstractPlugin);
  VirtualTourPlugin.id = 'virtual-tour';

  exports.EVENTS = EVENTS;
  exports.MODE_3D = MODE_3D;
  exports.MODE_CLIENT = MODE_CLIENT;
  exports.MODE_GPS = MODE_GPS;
  exports.MODE_MANUAL = MODE_MANUAL;
  exports.MODE_MARKERS = MODE_MARKERS;
  exports.MODE_SERVER = MODE_SERVER;
  exports.VirtualTourPlugin = VirtualTourPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=virtual-tour.js.map