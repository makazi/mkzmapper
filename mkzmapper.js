(function($) {

    /**
     * Function findPos()
     * fonction jQuery qui retourne la position de l'élément par rapport au parent direct.
     */
    $.fn.findPos = function() {
        obj = jQuery(this).get(0);
        var curleft = obj.offsetLeft || 0;
        var curtop = obj.offsetTop || 0;
        while (obj = obj.offsetParent) {
            curleft += obj.offsetLeft
            curtop += obj.offsetTop
        }
        return {
            x: curleft,
            y: curtop
        };
    };

    /**
     * Function mkzmapper
     * met en place les différentes fonctionnalité du plugin avec les options fournies en paramètre.
     * @param 	options : objet contenant les options.
     * @return 	$(this) avec les transformations.
     */
    $.fn.mkzmapper = function(options) {

        options = mkzmapper.defaultOption(options); // Met par défaut les hamps manquant.

        return this.each(function() {

            
            var diagram = $(this);
            var id = diagram.attr("id");


            // On récupère la taille du contenant.
            var widthDiagram = $(this).css("width");
            var heightDiagram = $(this).css("height");

            $(this).css({
                "height": "",
            }); // On redéfinit le bloc comme étant le limiteur.

            // Création du bloc permettant d'avoir un scroll.
            var ViewBoard = $("<div>").addClass("mkzmapper-ViewBoard").addClass("mkzmapper-container").css({
                "width": widthDiagram,
                "height": heightDiagram
            }).appendTo(this);

            // Création du bloc servant à poser les éléments du schéma.
            var board    = $("<div>").addClass("mkzmapper-board").css({
                "width": options.width,
                "height": options.height
            }).appendTo("#" + id + " .mkzmapper-ViewBoard");

            // On met en place l'instance jsPlumb.
            var nonPlumbing = jsPlumb.getInstance();
            diagram.data("mkzmapper-jsPlumbInstance", nonPlumbing); // On ajoute au DOM du diagram, l'instance.
            diagram.data("mkzmapper-options", options); // On ajoute au DOM du diagram les options.

            mkzmapper.registerConnector(diagram); // On créer les types de connecteurs.

            if (!options.readOnly) // Si l'utilisateur à défini le diagram comme étant utilisable.
            {

                /*----------------- Début de la définition du contextMenu ----------------*/
                // Création du contextMenu
                var contextMenu = $("<ul>").addClass("mkzmapper-optionsContextMenu").appendTo(ViewBoard);
                var menuStyle = options.menuStyle;
                var Class;

                for (var i = 0; i < menuStyle.length; i++) // Création du sous-menu avec le style de connecteurs.
                {
                    Class = menuStyle[i].dashed ? "fa-ellipsis-h" : "fa-minus"; //choix de l'icône selon pointillé ou non.

                    $("<li>").data("mkzmapper-action", menuStyle[i].action).append("<span class= 'fa " + Class + "' style='color :" + menuStyle[i].color + ";'></span> " + menuStyle[i].name).appendTo(contextMenu);
                    if (i != menuStyle.length - 1)
                        $("<li>").append('----').appendTo(contextMenu);
                }

                $(contextMenu).menu(); // instancie le contextMenu comme un menu jQueryUI


                // Définit la click sur la connexion.
                nonPlumbing.bind("click", function (conn, event){
                    var styles = options.menuStyle;
                    var connector;
                    var Uuids = conn.getUuids();

                    mkzmapper.deselect(diagram);

                    var info = {
                        style : $(conn).data('mkzmapper-style'),
                        type  : $(conn).data('mkzmapper-type'),
                        connector : $(conn).data('mkzmapper-connector'),
                        arrow :  $(conn).data('mkzmapper-arrow')
                    }

                    nonPlumbing.detach({
                        uuids: Uuids
                    });
                    var newConn = nonPlumbing.connect({
                        uuids: Uuids,
                        type: 'Selected',
                        connector: info.connector
                    });
                    $(newConn).data("mkzmapper-style", info.style);
                    $(newConn).data("mkzmapper-type", info.type);
                    $(newConn).data("mkzmapper-connector", info.connector);
                    $(newConn).data("mkzmapper-arrow", info.arrow);


                    mkzmapper.selected.connector.push(newConn);
                    mkzmapper.selected.diagram = diagram;
                });
                // If the document is clicked somewhere
                $(document).bind("mousedown", function(e) {
                    // If the clicked element is not the menu;
                    if (!$(e.target).parents('.mkzmapper-optionsContextMenu').length > 0) {
                        // Hide it
                         contextMenu.fadeOut();
                    }
                });
                // If the menu element is clicked
                contextMenu.find("li").click(function(event) {

                    var data = contextMenu.data("mkzmapper-connect"); // récupère les id des ancres.
                    var styles = options.menuStyle;
                    // Hide it AFTER the action was triggered
                     contextMenu.fadeOut("fast");
                    for (var j = 0; j < styles.length; j++)
                    {
                        if (styles[j].action == $(this).data("mkzmapper-action")) {
                            mkzmapper.deselect(diagram);

                            nonPlumbing.detach({
                                uuids: data
                            });
                            var optionStyle = {
                                uuids: data,
                                type: styles[j].type,
                                connector: styles[j].connector,
                            };

                            if(styles[j].arrow == 'both')
                                 optionStyle['overlays']= [
                                     "Label",
                                     [ "Arrow", { location:0, direction : -1 } ],
                                     [ "Arrow", { location:1 } ]
                                ];
                            else if(styles[j].arrow == 'backward')
                                 optionStyle['overlays']= [
                                     "Label",
                                     [ "Arrow", { location:0, direction : -1 } ]
                                ];
                            else if(styles[j].arrow == 'forward')
                                 optionStyle['overlays']= [
                                     "Label",
                                     [ "Arrow", { location:1 } ]
                                ];

                            var conn = nonPlumbing.connect( optionStyle);
                            $(conn).data('mkzmapper-style', styles[j].action); // Definit le style de connection, pour recréer le schéma. 
                            $(conn).data('mkzmapper-type', styles[j].type);
                            $(conn).data('mkzmapper-connector', styles[j].connector);
                            $(conn).data('mkzmapper-arrow', styles[j].arrow);

                        }
                    }
                    
                });

                /*----------------- Fin de la définition du contextMenu ----------------*/

                // Définition du feeder
                if (options.feeder != "") // Si un feeder a été définit dans les options.
                {
                    // Variables
                    var feeder = $(options.feeder);
                    var child  = feeder.children();

                    feeder.css({"overflow":"auto"});

                    // Ajoute la classe droppable à tout les éléments listés dans le feeder.
                    for (var i = 0; i < child.length; i++)
                        $(child[i]).addClass("mkzmapper-droppable");

                    // Définit la liste des serveurs avec la caractéristisque sortable.
                    feeder.sortable({
                        revert: 100,
                        cursor: "move"
                    });


                    // Autorise les élements appartenant à la liste des serveurs d'être droppé dans le board de schémas.
                    board.droppable({
                        accept: options.feeder+">.mkzmapper-droppable",
                        drop: function(event, ui) // Lors d'un drop on définit les éléments suivant :
                            {
                                if(parseInt(ui.draggable.css("left")) > diagram.findPos().x && parseInt(ui.draggable.css("left")) <= diagram.findPos().x+parseInt(ViewBoard.css("width")) && parseInt(ui.draggable.css("top")) > diagram.findPos().y && parseInt(ui.draggable.css("top")) <= diagram.findPos().y+ parseInt(ViewBoard.css("height")) )
                                {
                                    // VARIABLES
                                    var current = ui.draggable; // récupère l'éléments courant.
                                   
                                    // Récupération des variables pour le calcul de la position de l'élément droppé.
                                    var scrollY = parseInt(ViewBoard.scrollTop()); // Récupère l'état de la scrollbar en Y.
                                    var scrollX = parseInt(ViewBoard.scrollLeft()); // Récupère l'état de la scrollbar en X.

                                    var offsetY = ViewBoard.findPos().y; // Récupère la position du 0 en Y dans la page.
                                    var offsetX = ViewBoard.findPos().x; // Récupère la position du 0 en X dans la page.


                                    // Calcul de la position de l'élément sur le board, selon la position où il a été droppé.
                                    var left = scrollX + parseInt(current.css('left')) - offsetX;
                                    var top = scrollY + parseInt(current.css('top')) - offsetY;
                                    var newCurrent = current.clone().addClass("mkzmapper-element").appendTo(board).css({
                                        "left": left+'px',
                                        "top":  top+'px'
                                    });

                                    // On réaffecte les données.
                                    for (var i in current.data())
                                        if (i != "mkzmapper-id")
                                            newCurrent.data(i, current.data(i));

                                    current.remove(); // Suppression de la liste des serveurs de l'élément droppé.

                                    mkzmapper.createAnchor(newCurrent, diagram) // Création des ancres de liaison sur l'élément.
                                    mkzmapper.blockOptions(newCurrent, diagram, feeder); // Rend l'élément draggable dans le board et définit l'évènement click sur x.

                                    // Définit l'évènement double-click sur un élément du board.
                                    newCurrent.click(function(event) {
                                        options.itemOnSelect($(this));
                                    }); 
                                }
                            }
                    });
                }
                // Suppression des éléments sélectionnés.
                $(document).keyup(function(touche){ // on écoute l'évènement keyup()
                    var appui = touche.which || touche.keyCode; // le code est compatible tous navigateurs grâce à ces deux propriétés
                
                    if(appui == 46){ // si le code de la touche est égal à 46 (Supp) supprime les éléments selectionnés
                        mkzmapper.selected.elements.forEach(function(item){
                            mkzmapper.deleteServer($(item), $(feeder.get(0)),mkzmapper.selected.diagram.data("mkzmapper-jsPlumbInstance"), board);
                        });
                        mkzmapper.selected.connector.forEach(function(item){
                            mkzmapper.selected.diagram.data("mkzmapper-jsPlumbInstance").detach({uuids : item.getUuids()});
                        });
                        mkzmapper.selected.elements = [];
                        mkzmapper.selected.connector = [];
                        mkzmapper.selected.diagram = "";
                    }
                    if(appui == 27) // si le code de la touche est égal à 27 (escape) désélectionne tous les éléments
                    {
                        mkzmapper.deselect(diagram);

                    }

                    if(appui == 77 && mkzmapper.selected.connector[0] != undefined)
                    {
                        var conn  = mkzmapper.selected.connector[0];
                        var posX  = parseInt($(conn.canvas).css("left"))+(parseInt($(conn.canvas).css("width"))/2);
                        var posY  = parseInt($(conn.canvas).css("top"))+(parseInt($(conn.canvas).css("height"))/2);

                        $(mkzmapper.selected.diagram.find(".mkzmapper-optionsContextMenu")).data('mkzmapper-connect', conn.getUuids()); // Initialise le menu avec les id des ancres (source et cible).
                        // Montre le contextmenu
                        $(mkzmapper.selected.diagram.find(".mkzmapper-optionsContextMenu")).finish().fadeIn().
                            // In the right position (the mouse)
                        css({
                            top: posY + "px",
                            left: posX+ "px",
                            /*display : "block",*/
                        });

                    }

                });

                // Selection multiple
               board.mousedown(function(event){
                    mkzmapper.deselect(diagram);
                    
                    // Calcul de la position du curseur dans le board.
                    var offSetX = parseInt(ViewBoard.scrollLeft())-parseInt(diagram.findPos().x) ;
                    var offSetY = ViewBoard.scrollTop()-diagram.findPos().y;
                    var posX    = parseInt(event.pageX)+offSetX;
                    var posY    = parseInt(event.pageY)+offSetY;

                    // On mémorise la position du curseur pour déterminer la eone à la fin. 
                    $(this).data("mkzmapper-mousePos", {"posX": posX, "posY": posY});
                    $("<div>").addClass("mkzmapper-selector").css({"position" :"absolute", "border" : "2px dashed red", "z-index" : 4000}).appendTo($(this));
                });

                // Si on sélectionne et que la souris se déplace.
                board.mousemove(function(event){
                    if($(this).data("mkzmapper-mousePos")) // Si il y a un mouvement d'initié en sélection multiple.
                    {
                        // Calcul de la position de la souris.
                        var offSetX = ViewBoard.scrollLeft()-parseInt(diagram.findPos().x);
                        var offSetY = ViewBoard.scrollTop()-diagram.findPos().y;
                        var posX = parseInt(event.pageX)+offSetX;
                        var posY = parseInt(event.pageY)+offSetY;
                        var posClic = $(this).data("mkzmapper-mousePos");

                        var diffX = posX - posClic.posX;
                        var diffY = posY - posClic.posY;

                        // Détermine la forme du rectangle de sélection.
                        if(posClic.posX < posX && posClic.posY < posY)
                        {
                            $(this).find(".mkzmapper-selector").css({"width" :diffX, "height": diffY, "left":posClic.posX, "top":posClic.posY}); 
                        }
                        else if(posClic.posX < posX && posClic.posY >= posY)
                        {
                            $(this).find(".mkzmapper-selector").css({"width" :diffX, "height": -diffY, "left":posClic.posX, "top":posClic.posY+diffY}); 
                        }
                        else if(posClic.posX >= posX && posClic.posY < posY)
                        {
                            $(this).find(".mkzmapper-selector").css({"width" :-diffX, "height": diffY, "left":posClic.posX+diffX, "top":posClic.posY}); 
                        }
                        else
                        {
                            $(this).find(".mkzmapper-selector").css({"width" :-diffX, "height": -diffY, "left":posClic.posX+diffX, "top":posClic.posY+diffY});   
                        }                        
                    }
                });

                // Lorsque l'on a finit de définir la zone de sélection.
                board.mouseup(function(event){
                    if( $(this).data("mkzmapper-mousePos") != undefined && $(this).data("mkzmapper-mousePos").posX)
                    {
                       
                        // Calcul de la position de la souris final.
                        var offSetX = parseInt(ViewBoard.scrollLeft())-parseInt(diagram.findPos().x) ;
                        var offSetY = ViewBoard.scrollTop()-diagram.findPos().y;
                        var posX = parseInt(event.pageX)+offSetX;
                        var posY = parseInt(event.pageY)+offSetY;
                        var posStart = $(this).data("mkzmapper-mousePos");

                        // Détermine la position la plus basse et la plus haute en X et Y.
                        if(posX > posStart.posX)
                        {
                            var startX = posStart.posX;
                            var stopX  = posX;
                        }
                        else
                        {
                            var startX = posX;
                            var stopX  = posStart.posX;
                        }
                        if(posY > posStart.posY)
                        {
                            var startY = posStart.posY;
                            var stopY  = posY;
                        }
                        else
                        {
                            var startY = posY;
                            var stopY  = posStart.posY;
                        }


                        board.find(".mkzmapper-element").each(function(){
                            // Calcul des coordonnées des 4 points
                            var elementCorner = {};
                            elementCorner["topLeft"]  = {'x': (parseInt($(this).css("left"))-startX), 'y': (parseInt($(this).css("top"))-startY)};
                            elementCorner["topRight"] = {'x': (elementCorner.topLeft.x +parseInt($(this).css("width"))+(parseInt($(this).css("padding-left")))+(parseInt($(this).css("padding-right"))) ), 'y': elementCorner.topLeft.y};
                            elementCorner["botLeft"]  = {'x': elementCorner.topLeft.x  , 'y': (elementCorner.topLeft.y +parseInt($(this).css("height"))+(parseInt($(this).css("padding-top")))+(parseInt($(this).css("padding-bottom"))))};
                            elementCorner["botRight"] = {'x': elementCorner.topRight.x  , 'y': elementCorner.botLeft.y};

                            var intersection = 0;

                            // Si on a les 4 coins qui d'un élément qui se trouvent dans le rectangle de sélection.
                            for (var i in elementCorner)
                            {
                                if(elementCorner[i].x >= 0 && elementCorner[i].x < (stopX -startX) && elementCorner[i].y >= 0 && elementCorner[i].y < (stopY-startY) )
                                    intersection ++;
                            }

                            // L'élément appartient au multiSelected.
                            if(intersection == 4)
                            {
                                mkzmapper.selected.diagram = diagram;
                                mkzmapper.selected.elements.push(this);
                                mkzmapper.selected.diagram.data("mkzmapper-jsPlumbInstance").selectEndpoints({source:$(this)}).setPaintStyle({ strokeStyle:diagram.data("mkzmapper-options").colorSelect }); 
                                mkzmapper.selected.diagram.data("mkzmapper-jsPlumbInstance").addToDragSelection($(this));
                            }

                        });   
                        // Une fois la sélection faite on supprime le rectangle de sélection.
                        diagram.find(".mkzmapper-selector").remove();
                    }
                    $(this).data("mkzmapper-mousePos", null);
                });
            }

            diagram.data("mkzmapper", true); // On met dans le DOM du diagram qu'il s'agit bien d'une instance mkzmapper.
            if (options.schema.servers != undefined) // Si on a donné un paramètre un schéma
            {
                diagram.mkzmapperImport(options.schema); // On initialise le diagram avec ce schéma.
            }
        });
    };

    /**
     * Function createJson
     * Créer un fichier .json à partir du schéma présent sur le board.
     * 
     */
    $.fn.mkzmapperExport = function() {
        if ($(this).data("mkzmapper")) {
            var diagram = $(this)
            var JsonFile = {}; // Objet contenant les données.
           // var id = diagram.attr("id"); // id unique du diagram.
            var Plumb = diagram.data("mkzmapper-jsPlumbInstance"); // Instance jsPlumb du diagram.
            var menuStyle = diagram.data("mkzmapper-options").menuStyle; // Récupère les styles du diagram.

            // DEFINITION DES PARAMETRE DU JSON.
            JsonFile["connections"] = []; // tableau contenant toutes les connections entre blocks.
            JsonFile["servers"] = []; // tableau contenant tous les éléments.
            JsonFile["menuStyle"] = menuStyle; // tableau contenant les styles des connectors, pour les reproduires.
            JsonFile["size"] = {
                "width": diagram.data("mkzmapper-options").width,
                "height": diagram.data("mkzmapper-options").height
            }; // Contient la taille définit.

            // VARIABLES
            var connectionList = Plumb.getAllConnections(); // Récupère l'ensemble des connections.
            var elements = diagram.find(".mkzmapper-board").find(".mkzmapper-element"); // Récupère l'ensemble des elements sur le board.


            for (var i = 0; i < connectionList.length; i++) // Pour chacune des connections.
            {
                var style = $(connectionList[i]).data('mkzmapper-style') == undefined ? "Default" : $(connectionList[i]).data('mkzmapper-style');

                var uuids = connectionList[i].getUuids(); // On récupère les ids des ancres sources et cibles.
                JsonFile.connections.push({
                    "source": uuids[0],
                    "target": uuids[1],
                    "style": style
                }); // On les ajoutes à la liste du tableau connections.
            }

            for (var j = 0; j < elements.length; j++) // Pour chacun des éléments, on sauve l'éléments avec son id, sa position en X et sa position en Y.
            {

                var dataExtra = {}; // tableau qui contient les informations supplémentaire dans le DOM de l'élément.

                for (var k in $(elements[j]).data()) // Pour chaque élément qui est dans le DOM de l'élément.
                    if (k != "mkzmapper-id" && k!= "sortableItem" && k!="sortable.preventClickEvent") // Si il ne fait pas parti des informations traité à part.
                        dataExtra[k] = $(elements[j]).data(k);

                JsonFile.servers.push({
                    "id": $(elements[j]).data("mkzmapper-id"),
                    data: dataExtra,
                    "posX": $(elements[j]).css("left"),
                    "posY": $(elements[j]).css("top"),
                    "txt" : $(elements[j]).text(),
                });
            }
            return JsonFile;
        }
    };
    /**
     * Function generateSchema
     * A partir d'un objet json recréer le schéma correspondant
     * @param   JsonFile : variable contenant un json.
     */
    $.fn.mkzmapperImport = function(JsonFile) {
        if ($(this).data("mkzmapper")) {
            if ( $(this).find(".mkzmapper-board").css("width") > JsonFile.size.width)
                 $(this).find(".mkzmapper-board").css({
                    "width": JsonFile.size.width + "px"
                });
            if ( $(this).find(".mkzmapper-board").css("height") > JsonFile.size.height)
                 $(this).find(".mkzmapper-board").css({
                    "height": JsonFile.size.height + "px"
                })

            mkzmapper.createBlocks(JsonFile, $(this)); // Appel la fonction qui créer les blocks, qui elle-même appelle en callback la fonction qui créer les liens.
        }
    };

    $.fn.mkzmapperExportPNG = function(callback) {
        var el    =  $(this).find(".mkzmapper-board").get(0);
        var style = $(el).css("background-image");
        $(el).css("background", "transparent");
        var diagram = $(this);
        html2canvas(el, {
            height: $(this).data("mkzmapper-options").height,
            width: $(this).data("mkzmapper-options").width,
            onrendered: function(canvas) {
                ctx = canvas.getContext('2d');
                // Render connections on top of same canvas

                connectors = $('._jsPlumb_connector', el);
                connectors.each(function() {
                    $svg = $(this)
                    svgStr = this.outerHTML;
                    ctx.drawSvg(svgStr, $svg.css("left"), $svg.css("top"));
                });
                var img = Canvas2Image.convertToPNG(canvas); // transforme en <img src="data:image/png;base64,..."
                $(el).css("background-image", style);
                callback(img);
            }
        });
    };
})(jQuery)

var mkzmapper = {};
mkzmapper.selected = {
    elements  : [],
    diagram   : "",
    connector : [],
};
/**
 * Function defaultOptions
 * Rempli avec les valeurs par defauts les champs manquants.
 * @param 	options : objet json contenant les options du plugin
 * @return  retourne le nouvel objet bien rempli, ou false si un champ indispensable a été homis.
 */
mkzmapper.defaultOption = function (options) {
    // OPTIONS PAR DEFAUT
    var defaultOptions = {
        "feeder": "",
        "itemOnSelect": "",
        "width": 4000,
        "height": 2000,
        "readOnly": false,
        "schema": {},
        "colorSelect": "red",
    };

    // CONNECTOR OPTION par défaut.
    var defaultConnector = [{
        "color": "#D58888",
        "width": 5,
        "colorHover": "#A86969",
        "connector": "Straight",
        "arrow" : "none"
    }, {
        "color": "#D58888",
        "width": 5,
        "colorHover": "#A86969",
        "connector": "Bezier",
        "arrow" : "none"
    }, {
        "color": "#86CFEC",
        "width": 5,
        "colorHover": "#69A8C2",
        "connector": "Straight",
        "arrow" : "none"
    }, {
        "color": "#86CFEC",
        "width": 5,
        "colorHover": "#69A8C2",
        "connector": "Bezier",
        "arrow" : "none"
    }, {
        "color": "white",
        "width": 5,
        "colorHover": "#D58888",
        "connector": "Straight",
        "arrow" : "none"
    }, {
        "color": "white",
        "width": 5,
        "colorHover": "#D58888",
        "connector": "Bezier",
        "arrow" : "none"
    }];
    // CONTEXTEMENU par defaut.
    var defaultMenu = [{
            "action": "Default6",
            "name": "Default6",
            "type": "Default6",
            "color": "#D58888",
            "width": 5,
            "colorHover": "#A86969",
            "connector": "Straight",
            "dashed": true
        }, {
            "action": "Default5",
            "name": "Default5",
            "type": "Default5",
            "color": "#D58888",
            "width": 5,
            "colorHover": "#A86969",
            "connector": "Bezier",
            "dashed": true
        }, {
            "action": "Default4",
            "name": "Default4",
            "type": "Default4",
            "color": "#86CFEC",
            "width": 5,
            "colorHover": "#69A8C2",
            "connector": "Straight",
            "dashed": true
        }, {
            "action": "Default3",
            "name": "Default3",
            "type": "Default3",
            "color": "#86CFEC",
            "width": 5,
            "colorHover": "#69A8C2",
            "connector": "Bezier",
            "dashed": true
        }, {
            "action": "Default1",
            "name": "Default1",
            "type": "Default1",
            "color": "white",
            "width": 5,
            "colorHover": "#D58888",
            "connector": "Straight",
            "dashed": false
        }, {
            "action": "Default2",
            "name": "Default2",
            "type": "Default2",
            "color": "white",
            "width": 5,
            "colorHover": "#D58888",
            "connector": "Bezier",
            "dashed": false
        }, {
            "action": "Default",
            "name": "Default",
            "type": "Default",
            "color": "white",
            "width": 5,
            "colorHover": "white",
            "connector": "Straight",
            "dashed": false
        },

    ];

    options = $.extend(defaultOptions, options); // Rempli avec les valeurs par défauts si besoin.

    // Traitement des options
    var contextMenu = options.menuStyle;
    if (contextMenu != undefined) // Si l'utilisateur a fourni des paramètre pour le contextMenu.
    {
        var style;
        var defaultValue;

        for (var i = 0; i < contextMenu.length; i++) // Pour chaucun des styles
        {
            if (contextMenu[i].action != undefined) // Si le champ obligatoire est fourni.
            {
                contextMenu[i] = $.extend(defaultConnector[i % 6], contextMenu[i]); // Ajoute les informations par defaut sur les le connector si non fourni.

                defaultValue = {
                        "name": contextMenu[i].action,
                        "type": contextMenu[i].action,
                        "dashed": false
                    } // Créer l'objet par défaut pour le nom et le type,
                contextMenu[i] = $.extend(defaultValue, contextMenu[i]); // Ajoute au style les dernières infos par défaut si nécessaire.
            } else // Si le champ action n'est pas fourni on ne fait rien.
                return false;
        }

        contextMenu.push({
            action: "Default",
            name: "Default",
            type: "Default",
            color: "white",
            width: 5,
            colorHover: "white",
            connector: "Straight",
            dashed: false
        });
    } else // Sinon on met le menu par défaut.
    {
        options["menuStyle"] = defaultMenu;
    }
    return options;
}

/**
 * Function blockOptions
 * attributs à un block dans le board la possibilité d'être draggable et définit l'évênement click sur la croix.
 * @param  item : id de la div à paramétrer.
 */
mkzmapper.blockOptions = function (item, diagram, feeder) {
    // Rend le bloc draggable.
    var Plumb = diagram.data("mkzmapper-jsPlumbInstance");

    if (!diagram.data("mkzmapper-options").readOnly) {
        Plumb.draggable(item, {
            grid:[10,10],
            containment: diagram, // Le block ne peut se déplacer que dans le bloc #limitation.
            cursor: "move", // La souris devient une main.
            revert: false ,// pas de retour en arrière.
        });

        // Définit l'action de click droit sur l'élément
        item.mousedown(function(event){
            if(mkzmapper.selected.elements.indexOf(this) == -1)/*!$(this).is(".mkzmapper-multiSelected"))*/
            {
                mkzmapper.deselect(diagram);
                mkzmapper.selected.elements.push(this);
                mkzmapper.selected.diagram = diagram;
                mkzmapper.selected.diagram.data("mkzmapper-jsPlumbInstance").selectEndpoints({source:$(this)}).setPaintStyle({strokeStyle:diagram.data("mkzmapper-options").colorSelect });
            }
        });
    }
}

/**
 * Function deleteServer
 * Supprime un Serveur du board et le remet dans la liste.
 * @param  item   : contient l'objet à supprimer.
 * @param  feeder : contient le feeder dans lequel retourner les éléments.
 * @param  Plumb  : contient l'instance jsPlumb.
 */
mkzmapper.deleteServer = function (item, feeder, Plumb, board) {
    
    Plumb.removeFromDragSelection(item);
    var myClass = item.attr("class").split(' ');
    for (i=0; i < myClass.length; i++)
    {
        if( myClass[i]=="_jsPlumb_endpoint_anchor" || myClass[i]== "jsplumb-draggable" || myClass[i]== "mkzmapper-element")
            myClass.splice(i,1);
    }

    // Copie l'élément dans la liste.
    item.addClass(myClass.join(' ')).clone().appendTo(feeder).css({
        "position": "relative",
        "top": "0px",
        "left": "0px"
    });
    Plumb.remove(item); // Supprime l'élément du board.
}

/**
 * Function createAnchor
 * Créer les ancres en définissant le style par défaut des flêches.
 * @param	item    : objet sur le quel on va fixer les ancres.
 * @param   diagram : Contient le diagram avec son DOM.
 */
mkzmapper.createAnchor = function(item, diagram) {
    var Plumb = diagram.data("mkzmapper-jsPlumbInstance");
    // VARIABLE DEFINISSANT LE STYLE DE LA CONNEXION ET DES ANCRES
    var common = {
        isSource: true, // Ancre définit comme source.
        isTarget: true, // Ancre définit comme cible.
        endpoint: ["Rectangle", {
            width: 10,
            height: 10
        }], // Forme de l'ancre.
        maxConnections: 1000, // Nombre maximum de connexion sur une ancre.
        paintStyle: {
            fillStyle: "#565656",
            outlineColor: "#363636",
            lineWidth: 4,
            outlineWidth: 1
        },

        connectorStyle: {
            strokeStyle: "white",
            lineWidth: 5
        }, // Style de la connexion
        connectorHoverStyle: {
            strokeStyle: "white",
            lineWidth: 6
        }, // Style au passage de la connexion.
        connectorHoverOverlays: [
            ["Arrow", {
                width: 20,
                length: 20,
                location: 0.67
            }]
        ],
        onMaxConnections: function(info, originalEvent) {
            console.log("user tried to drop connection", info.connection, "on element", info.element, "with max connections", info.maxConnections);
        }
    };
    // Définition des points d'ancrages.
    //convertToPNG
    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-top1" + item.data('mkzmapper-id'),
        anchor: [0.25, 0, 0, -1]
    }, common);


    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-top2" + item.data('mkzmapper-id'),
        anchor: [0.5, 0, 0, -1]
    }, common);

    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-top3" + item.data('mkzmapper-id'),
        anchor: [0.75, 0, 0, -1]
    }, common);

    // BOTTOM
    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-bottom1" + item.data('mkzmapper-id'),
        anchor: [0.25, 1, 0, 1]
    }, common);

    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-bottom2" + item.data('mkzmapper-id'),
        anchor: [0.5, 1, 0, 1]
    }, common);

    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-bottom3" + item.data('mkzmapper-id'),
        anchor: [0.75, 1, 0, 1]
    }, common);

    // LEFT
    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-left1" + item.data('mkzmapper-id'),
        anchor: [0, 0.25, -1, 0]
    }, common);

    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-left2" + item.data('mkzmapper-id'),
        anchor: [0, 0.5, -1, 0]
    }, common);

    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-left3" + item.data('mkzmapper-id'),
        anchor: [0, 0.75, -1, 0]
    }, common);

    // RIGHT
    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-right1" + item.data('mkzmapper-id'),
        anchor: [1, 0.25, 1, 0]
    }, common);

    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-right2" + item.data('mkzmapper-id'),
        anchor: [1, 0.5, 1, 0]
    }, common);

    Plumb.addEndpoint(item, {
        uuid: "mkzmapper-right3" + item.data('mkzmapper-id'),
        anchor: [1, 0.75, 1, 0]
    }, common);
}


/**
 * Function registerConnector
 * Initialise les type des connecteurs à partir du menu de styles contenu dans le DOM du diagram.
 * @param 	diagram : Contient un DOM avec toutes les options, dont notamment le menuStyle
 */
mkzmapper.registerConnector = function(diagram) {
    var Plumb = diagram.data("mkzmapper-jsPlumbInstance");
    var menuStyle = diagram.data("mkzmapper-options").menuStyle;
    Plumb.Defaults.Connector = "Straight"; // Définit les connexions défaut comme droite.
    for (var i = 0; i < menuStyle.length; i++) {
        if (menuStyle[i].dashed) {
            connectorStyle = {
                paintStyle: {
                    dashstyle: "4 2",
                    strokeStyle: menuStyle[i].color,
                    lineWidth: menuStyle[i].width
                },
                hoverPaintStyle: {
                    strokeStyle: menuStyle[i].colorHover,
                    lineWidth: menuStyle[i].width+2
                }, // Style au passage de la connexion.
            };
        } else {
            connectorStyle = {
                paintStyle: {
                    strokeStyle: menuStyle[i].color,
                    lineWidth: menuStyle[i].width
                },
                hoverPaintStyle: {
                    strokeStyle: menuStyle[i].colorHover,
                    lineWidth: menuStyle[i].width+2
                }, // Style au passage de la connexion.
            };
        }

        Plumb.registerConnectionType(menuStyle[i].type, connectorStyle); // Définition des différents types de connexions.
    }

    Plumb.registerConnectionType("Default", {
        paintStyle: {
            strokeStyle: "white",
            lineWidth: 5
        },
        hoverPaintStyle: {
            strokeStyle: "white",
            lineWidth: 6
        }, // Style au passage de la connexion.
    });

    Plumb.registerConnectionType("Selected", {
        paintStyle: {
            dashstyle: "1 1",
            strokeStyle:  diagram.data("mkzmapper-options").colorSelect,
            lineWidth: 5
        },
        hoverPaintStyle: {
            strokeStyle:  diagram.data("mkzmapper-options").colorSelect,
            lineWidth: 5
        },
    });
}

/**
 * Function createBlocks
 * A partir du json met en place les blocks puis appel la fonction qui créer les liens.
 * @param	JsonFile : variable contenant un json.
 * @param   diagram  : 
 * @param	callback : function qui créer les connections
 * @return  callback : avec le fichier Json.
 */
mkzmapper.createBlocks = function(JsonFile, diagram) {
    // VARIABLES
    var Plumb = diagram.data("mkzmapper-jsPlumbInstance");


    var board = diagram.find('.mkzmapper-board');
    var id;
    var alreadyExist;
    var elementExist;

    var feeder = $(diagram.data("mkzmapper-options").feeder);

    $(board).find('.mkzmapper-element').each(function() {
        mkzmapper.deleteServer($(this), feeder, Plumb, board);
    });
    var elements = $(diagram.data("mkzmapper-options").feeder + " .mkzmapper-droppable");
    if (diagram.data("mkzmapper-options").feeder != "")
        var Nodename = $(diagram.data("mkzmapper-options").feeder + " .mkzmapper-droppable").get(0).nodeName;
    else
        var Nodename = "div";

   
    for (var j = 0; j < JsonFile.servers.length; j++) // Pour chaque bloc
    {
        alreadyExist = false;
        id = JsonFile.servers[j].id; // On récupère l'id du bloc

        // Récupération des différentes informations fournies par le serveur [ex : ip, description ...].
        for (var i = 0; i < elements.length; i++) {
            if ($(elements[i]).data("mkzmapper-id") == id) {
                alreadyExist = true;
                elementExist = elements[i];
            }
        }

        if (!alreadyExist || diagram.data("mkzmapper-options").feeder == "") {
            // Création du bloc.
            var newElement = $("<" + Nodename + ">").addClass("mkzmapper-element mkzmapper-droppable mkzmapper-DefaultElement").css({
                "top": JsonFile.servers[j].posY,
                "left": JsonFile.servers[j].posX, 
                "position" : "absolute",
            }).appendTo(board);
            
            $(newElement).append( "<label> <span>" + JsonFile.servers[j].txt + "</span> </label>");
            $(newElement).data("mkzmapper-id", id);
            for (var k in JsonFile.servers[j].data)
                newElement.data(k, JsonFile.servers[j].data[k]);
        } else {
            // On déplace le bloc.
            var newElement = $(elementExist).clone().appendTo(board).addClass("mkzmapper-element").css({
                "top": JsonFile.servers[j].posY,
                "left": JsonFile.servers[j].posX,
                "position" : "absolute",
            });
            for (var i in $(elementExist).data()) {
                newElement.data(i, $(elementExist).data(i));
            }
            $(elementExist).remove(); // Suppression de la liste des serveurs de l'élément droppé.
        }
           
        mkzmapper.createAnchor(newElement, diagram); // Création des ancres de liaison sur l'élément.
        mkzmapper.blockOptions(newElement, diagram, feeder); // Rend l'élément draggable dans le board et définit l'évènement click sur x.

        newElement.click(function(event) {
            diagram.data("mkzmapper-options").itemOnSelect($(this));
        });

    }
    mkzmapper.createConnections(JsonFile, diagram); // appel la fonction callback.
}

/**
 * Function createConnections
 * Met en place les connections à partir des ancres sources et ancres cibles et applique le style.
 * @param	JsonFile : variable contenant le json.
 * @param   diagram
 */
mkzmapper.createConnections = function(JsonFile, diagram) {
    var styles = JsonFile.menuStyle;
    var Plumb = diagram.data("mkzmapper-jsPlumbInstance");
    var add;

   	var diagStyles = diagram.data("mkzmapper-options").menuStyle;
   	var tmp = [];
    for (var l = 0; l < styles.length; l++) {
        add = true;

        for (var k = 0; k < diagStyles.length; k++) {
            if (diagStyles[k].action == styles[l].action)
                add = false;
        }
        if (add)
        	tmp.push(styles[l]);    
    }
    for (var m in tmp)
        diagram.data("mkzmapper-options").menuStyle.push(tmp[m]);


    mkzmapper.registerConnector(diagram);

    for (var i = 0; i < JsonFile.connections.length; i++) // Pour chaque connection
    {
        for (var j = 0; j < styles.length; j++) // Recherche le style coorespondant.
        {
            if (styles[j].action == JsonFile.connections[i].style) // Puis créer la connexion.
            {
                var optionStyle = {
                    uuids: [JsonFile.connections[i].source, JsonFile.connections[i].target],
                    type: styles[j].type,
                    connector: styles[j].connector,
                };

                if(styles[j].arrow == 'both')
                    optionStyle['overlays']= [
                        "Label",
                            [ "Arrow", { location:0, direction : -1 } ],
                            [ "Arrow", { location:1 } ]
                    ];
                else if(styles[j].arrow == 'backward')
                    optionStyle['overlays']= [
                        "Label",
                        [ "Arrow", { location:0, direction : -1 } ]
                    ];
                else if(styles[j].arrow == 'forward')
                    optionStyle['overlays']= [
                        "Label",
                        [ "Arrow", { location:1 } ]
                    ];
                var connect = Plumb.connect(optionStyle); // On recréer la connexion à partir des ancres sources et cibles.
                $(connect).data('mkzmapper-style', styles[j].action);
                $(connect).data('mkzmapper-type', styles[j].type);
                $(connect).data('mkzmapper-connector', styles[j].connector);
                $(connect).data('mkzmapper-arrow', styles[j].arrow);

            }
        }
    }
}

mkzmapper.deselect = function(diagram){
    // Déselection des éléments sélection et retour au style de base.
    diagram.data("mkzmapper-jsPlumbInstance").clearDragSelection();
    mkzmapper.selected.elements.forEach(function(item){
        mkzmapper.selected.diagram.data("mkzmapper-jsPlumbInstance").selectEndpoints({source:$(item)}).setPaintStyle({ fillStyle:"#565656", strokeStyle:"#363636" }); 
    });
    mkzmapper.selected.elements = [];

    // Déselecion des connecteurs sélectionnés
    mkzmapper.selected.connector.forEach(function(item){
        Uuids = item.getUuids(); // On récupère les id des ancres.
        info = {
            style     : $(item).data("mkzmapper-style"),
            type      : $(item).data("mkzmapper-type"),
            connector : $(item).data("mkzmapper-connector"),               
            arrow     : $(item).data("mkzmapper-arrow")
        }
        mkzmapper.selected.diagram.data("mkzmapper-jsPlumbInstance").detach({   // On détache la connection.
            uuids: Uuids,
        });

        var optionStyle = {
            uuids: Uuids,
            type: info.type,
            connector:  info.connector,
        };

        if(info.arrow == 'both')
            optionStyle['overlays']= [
                "Label",
                    [ "Arrow", { location:0, direction : -1 } ],
                    [ "Arrow", { location:1 } ]
                ];
            else if(info.arrow == 'backward')
                optionStyle['overlays']= [
                    "Label",
                    [ "Arrow", { location:0, direction : -1 } ]
            ];
            else if(info.arrow == 'forward')
                optionStyle['overlays']= [
                    "Label",
                    [ "Arrow", { location:1 } ]
                ];

        var newConn = mkzmapper.selected.diagram.data("mkzmapper-jsPlumbInstance").connect(optionStyle);

        $(newConn).data('mkzmapper-style', info.style);
        $(newConn).data('mkzmapper-type', info.type);
        $(newConn).data('mkzmapper-connector', info.connector);
        $(newConn).data('mkzmapper-arrow', info.arrow);

    });
    mkzmapper.selected.connector = [];
    mkzmapper.selected.diagram = "";
}
