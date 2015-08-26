# Plugin jQuery mkzmapper.js

Ce plugin permet de créer à partir d’une zone “feeder” et d’une zone “diagram”, de pouvoir drag and drop les objets du feeder vers le diagram, puis de créer des schémas, exportablent sous le format JSON, réutilisablent sous forme d’importation.

## Utilisation du plugin

### Configuration minimal

JavaScript :

```sh
<script src="https://code.jquery.com/jquery-1.11.3.min.js"   ></script>
<script src="https://code.jquery.com/ui/1.11.4/jquery-ui.js" ></script>
<script src="../lib/dom.jsPlumb-1.7.6.js"                 ></script>
<script src="../mkzmapper.js"                         ></script>
```

CSS : 

```sh
<link rel="stylesheet" href="https://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.min.css">
<link rel="stylesheet" href="../mkzmapper.css">
```

### Déclaration du **Diagram**

Il faut commencer par définir un bloc comme étant le diagram, c’est à dire la zone de réception des schémas :

html : *La définition d’un id est indispensable pour le bon fonctionnement du plugin*.

```sh
<div id = “monDiagram” style = “width:500px; height:300px; left: 295px;”> </div>
```

JavaScript :
```sh
<script>
      $(“#monDiagram”).mkzmapper(options);
</script>
```
### Les options

Les options se présentent sous la forme d’un json, avec un certain nombre d’option dont voici la liste exhaustive : 

- **minWidth | minHeight** : ces deux paramètres permettent de définir la taille minimale scrollable du diagram, par defaut les valeurs sont *[ minWidth : 4000, minHeight : 2000]*.
- **feeder** :  on fourni l’id de du bloc sous la forme “#<nomduFeeder>” que l’on souhaite définir comme feeder, c’est à dire que les fils directs du bloc seront droppables dans le diagram.

##### Exemple

html :

*La présence d’un mkzmapper-id dans le data des éléments fils du feeder est indispensable (c’est mkzmapper-id doit être unique).*
```sh
<ul id = “#monFeeder”>
      <li data-mkzmapper-id = “1”> Mon item 1</li>
      <li data-mkzmapper-id = “2”>Mon item 2</li>
         ...
      <li data-mkzmapper-id = “monId”> Mon item n</li>
</ul>
```

JavaScript :
```sh
var options =
{
      …
      minWidth  : 4000,
      minHeigth : 2000,
      feeder    : “#monFeeder”,
      … 
}
$(“#monDiagram”).mkzmapper(options);
```
- **menuStyle** : tableau d’objet json permettant de définir l’ensemble des styles d’un Connector. en fournissant un certain nombre de paramètre, dont le seul obligatoire est l’action.
	- *action* : définit le nom de l’action dans le DOM du contextMenu. [obligatoire].
	- *name* : définit le texte qui apparaitera dans le context menu (par défaut ce qui a été fourni dans le champ action).
	- *type*: définit le nom utilisé pour définir le type de connector dans jsPlumb.
	- *color* : définit la couleur du connecteur.
	- *colorHover* : définit la couleur du connecteur lors de son survol.
	- *connector* : **“Straight”** ou **“Bezier”**, définit si le connecteur sera droit ou incurvé, par défaut il sera droit.
	- *dashed* : *true* ou *false*, définit si le connecteur est en pointillé ou non, par défaut il sera à false. 

##### Exemple 
JavaScript :
```sh
{
 … 
    menuStyle : [
      {action : "bddS"},
      {action : "bddC", name : "BDD (Curving)", color : "#86C276",
      colorHover : "#669F56", connector : "Bezier"},
      {action : "apiCD", name : "API (Curving & dashed)", connector
      :"Bezier", dashed : true }
     ]
 …
}
```
- **itemOnSelect** : fonction qui prend en argument l’élément, elle définit l’action effectuée lors d’un double-click sur un élément du diagram, par exemple exploiter les données que l’on fournit dans le DOM des éléments (ex : ip, description etc …).

##### Exemple 
html : 
```sh
<ul id = “#monFeeder”>
      <li data-id = “1” data-id = ‘{"description":"je suis un item 1","nom":"1"}’>  
            Mon item 1
      </li>
      <li data-id = “2” data-id = ‘{"description":"je suis un item 2","nom":"2"}’>  
            Mon item 2
      </li>
      … 
</ul>
<div id = “monDiagram” style = “width:500px; height:300px; left: 295px;”> </div>
<div id = “detail”> </div>
```
JavaScript : 
```sh
{
  … 
  itemOnSelect : function($item){ // ceci est un exemple.

     $("#detail").css({ 
     "margin" : "0px 0px 0px 0px",
     "width": "250px",
     "height": "100%", "color": "#FFF",
     "position" : "absolute", 
     "display" : "none"
     });
     
     $("#detail legend").css({ "color": "white", "font-weight": "bold"});
                    
       optionDblclick($item, $("#detail"), $("#monDiagram") );
  }
  … 
}
```
- **schema** :  il s’agit d’un objet sous la forme 
```sh
{
   connections : Array,
   servers     : Array,
   menuStyle   : Array
}
```
- *Connections* :

	```sh
	connections  : [
	  {
	     source :  ,/* contient l’id de l’ancre source, sous la forme “<position><data-id  element>”, avec <position> qui peut etre “bottom<1,2,3>” ou top, left, right*/
	     target : , /* pareil mais avec l’ancre cible*/
	     style  : , /* Contient le type, du style appliqué au connector*/

	   }
	]
	```
- *Servers* : 

	```sh
	servers  : [
	  {
	     id :  ,/* contient l’id de l’element (dans le DOM)*/
	     posX : , /*position en X dans le diagram*/
	     posY : , /*position en y dans le diagram*/
	     data : , /*contient l’ensembles des Extradata*/
	     txt  : , /*Contient le texte écrit dans la div*/
	   }
	]
	```
- *menuStyle* : contient l’ensemble des styles initialisé sur le diagram qui contenait le schéma, pour pouvoir appliquer les styles aux connecteurs.

- **readOnly** : prend true ou false, si l’option est mise à true alors l’utilisateur ne pourra pas effectuer de modification sur le schéma (que ce soit sur les liens, la position ou la présence d’un élément). Par défaut le champ est false.



Il est à noter que toutes ces options sont optionnels, si aucune options n’est fournie le bloc deviendra un bloc qui sera dans un second temps capable de recevoir l’importation d’un schéma et d’en exporter les modifications par exemple.

## Exportation d'un schéma

Une fois que le diagram est initialisé avec l’ensemble des options souhaités, et que vous avez réalisé votre schéma, vous pouvez exporter un schéma avec la commande : 

```sh
$(“#monDiagram”).mkzmapperExport();
```
cette commande va retourner l’objet contenant toutes les caractéristiques du schéma sous la forme vue plus haut.

## Importation d'un schéma 

pour importer un objet schéma vers un diagram initialisé il suffit d’avoir la commande suivante : 

```sh
$(“#monDiagram”).mkzmapperImport(schema);
```

## Exportation d'un schéma en .png

#### Configuration nécessaire

```sh
<script src="../lib/canvas2image.js"></script>
<script src="../lib/html2canvas.js"></script>
<script src="http://gabelerner.github.io/canvg/rgbcolor.js"  type="text/javascript"></script>
<script src="http://gabelerner.github.io/canvg/StackBlur.js" type="text/javascript" ></script>
<script src="http://gabelerner.github.io/canvg/canvg.js"     type="text/javascript"></script>
```
La fonction qui permet l’export prend en paramètre un callback avec comme paramètre l’image qui sera sous la forme : **<img src="data:image/png;base64,...”>**.

```sh
$(“#monDiagram”).mkzmapperExportPNG(function(img){ console.log(img);});
```