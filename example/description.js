function optionDblclick(item, detail, diagram)
{	
	
		// Fait disparaître le contenu de #Description.
		detail.fadeOut(function(){

			detail.html("");	// Vide tout le contenu de la description.
			createDescription(item, detail, diagram);	// Créer la nouvelle description.
			detail.fadeIn();	// Fait réapparaître la description.
		});	
		
}

/**
 * Function createDescription
 * Ajoute tous les informations d'un élément à #Description.
 * @param  $id : l'id de l'élément.
 */
function createDescription(item, detail, diagram)
{

				// VARIABLES
	var data = item.data("info");	// Contient les information à afficher.
	

	
	detail.fadeIn();	// Fais apparaître le contenu de description.

		// Ajout des éléments.
	detail.append('<legend id="title" style="color : white;"> Description </legend>');	// Ajoute le titre de l'onglet.

	for (var i in data)
		detail.append('<div class="infoDetail" style="display:none;"> <legend> '+i+' </legend> <span>'+data[i]+'</span></div>'); // Ajoute les informations
				
		//	Fais apparaître le tout.
	$(".infoDetail").fadeIn();	

}