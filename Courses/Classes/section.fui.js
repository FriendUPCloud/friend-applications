
// Checkbox element
class FUISection extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        // Set stuff on this.domElement.innerHTML
        this.domElement.classList.add( 'FUISection' );
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        
    }
    refreshDom()
    {
        super.refreshDom();
        
        
    }
    getMarkup( data )
    {
    	
    }
}

FUI.registerClass( 'section' );



