function optionDblclick(item, info, diagram)
{	
	
		// Fait disparaître le contenu de #Description.
		info.fadeOut(function(){

			info.html("");	// Vide tout le contenu de la description.
			createDescription(item, info, diagram);	// Créer la nouvelle description.
			info.fadeIn();	// Fait réapparaître la description.
		});	
		
}

/**
 * Function createDescription
 * Ajoute tous les informations d'un élément à #Description.
 * @param  $id : l'id de l'élément.
 */
function createDescription(item, info, diagram)
{

				// VARIABLES
	var data = item.data("info");	// Contient les information à afficher.
	

	
	info.fadeIn();	// Fais apparaître le contenu de description.

	for (var i in data)
		info.append('<div class="infoDetail" style="display:none;"> <legend> '+i+' </legend> <span>'+data[i]+'</span></div>'); // Ajoute les informations
				
		//	Fais apparaître le tout.
	$(".infoDetail").fadeIn();	

}