/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/


/* StatBox

*/

class FUIStatsbox extends FUIElement
{
    constructor( options )
    {
        super( options );
    }
    
    setData( dataSet )
    {
        const self = this;
        // mainStat
        // mainIcon
        // mainText
        
        // subStat
        // subText
        let html = '\
        <div class="statboxMain">\
            <div class="statboxMainStat">\
                {mainNum}\
            </div>\
            <div class="statboxMainIcon IconSmall fa-fw {mainIcon}">\
            </div>\
        </div>\
        <div class="statboxMainText">\
            {mainText}\
        </div>\
        <div class="statboxSub">\
            {subStat} {subText}\
        </div>\
        ';
        
        if ( null == dataSet.subStat )
            dataSet.subStat = '';
        if ( null == dataSet.subText )
            dataSet.subText = '';
        const keys = Object.keys( dataSet );
        console.log( 'inputs', {
            dataSet : dataSet,
            keys    : keys,
        });
        let l = keys.length;
        for( ;l; )
        {
            l--;
            html = html.split( '{'+keys[ l ]+'}' ).join( dataSet[ keys[ l ]]);
        }
        console.log( 'html', html );
        self.domElement.innerHTML = html;
    }
    
    attachDomElement()
    {
        const self = this;
        console.log( 'ccStatBox.attachDomElement',{
            del : self.domElement,
            opt : self.options,
        });
        
        super.attachDomElement();
        self.domElement.classList.toggle( 'fuiStatsbox', true );
        if ( null != self.options.id )
            self.domElement.id = self.options.id;
        if ( null != self.options.bgColor )
            self.domElement.style.backgroundColor = self.options.bgColor;
        
    }
    
    grabAttributes()
    {
        
    }
}
FUI.registerClass( 'statsbox' );


/* chart.js UI element

*/
class FUIChartbox extends FUIElement
{
    constructor( options )
    {
        super( options );
    }
    
    setData( dataset, description )
    {
        const self = this;
        self.options.chart = dataset;
        self.chart = new Chart( self.cEl, self.options.chart );
        console.log( 'setdata.shart', self.chart );
        const l1 = self.domElement.children[1];
        const l2 = self.domElement.children[2];
        const pr = self.domElement.children[3];
        console.log( 'setData l1, l2', [ l1, l2 ]);
        l1.innerHTML = description.label1 || 'label1';
        l2.innerHTML = description.label2 || 'label2';
        pr.innerHTML = description.progress || '92%';
    }
    
    attachDomElement()
    {
        const self = this;
        console.log( 'ccChart', {
            del : self.domElement,
            opt : self.options,
        });
        super.attachDomElement();
        self.cEl = document.createElement( 'canvas' );
        self.domElement.appendChild( self.cEl );
        self.domElement.classList.add( 'chartBox' );
        const l1 = document.createElement( 'div' );
        const l2 = document.createElement( 'div' );
        const pr = document.createElement( 'div' );
        self.domElement.appendChild( l1 );
        self.domElement.appendChild( l2 );
        self.domElement.appendChild( pr );
        
        if ( !self.options.chart )
            return;
        
        self.chart = new Chart( self.cEl, self.options.chart );
        console.log( 'shart', self.chart );
    }
    
    grabAttributes()
    {
        const self = this;
        console.log( 'ccChart.grapAttributes, na m8')
    }
    
}
FUI.registerClass( 'chartbox' );
