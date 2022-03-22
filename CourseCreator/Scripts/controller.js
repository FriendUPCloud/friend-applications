Application.run = function( msg )
{
	
}


Application.receiveMessage = function( msg )
{
	if( msg.command == 'loadcontroller' )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( me, md )
		{
			if( me != 'ok' )
			{
				CloseView();
				return;
			}
			let cl = JSON.parse( md );
			let rawdata = cl.Data;
			let data = {};
			
			// To measure
			let correct = 0;
			let errors = 0;
			let totals = 0;
			
			// Find duplicates and rebuild data
			for( let a = 0; a < rawdata.length; a++ )
			{
				// Create entry based on page id
				let row = rawdata[ a ];
				if( !data[ row.PageID ] )
				{
					// The page contains the following data
					data[ row.PageID ] =  {
						pageName: row.PageName,
						dataId: row.DataID,
						elements: {} // question elements, key, original element ID
					};
				}
				
				// Reference to all data on this page
				let obj = data[ row.PageID ];
				
				// Decode properties and add to element if it exists (multiple choice)
				if( row.Properties.substr( 0, 7 ) == 'BASE64:' )
				{
					// Decode properties
					let d = row.Properties.substr( 7, row.Properties.length - 7 );
					d = JSON.parse( Base64.decode( d ) );
					
					// Fill unique page element with data
					if( !obj.elements[ row.OriginalElementID ] )
					{
						obj.elements[ row.OriginalElementID ] = {
							question: d.question,
							answers: {} // answers (keyed by elementID hashes),
						};
					}
					let element = obj.elements[ row.OriginalElementID ];
					if( !element.choices )
					{
						if( d.checkBoxes )
							element.choices = d.checkBoxes;
						if( d.radioBoxes )
							element.choices = d.radioBoxes;
					}
				}
				
				obj.elements[ row.OriginalElementID ].answers[ row.ElementID ] = true;
				
			}
			
			// Begin listing results
			let str = '<h2>' + cl.Name + '</h2>';
			str += '<table border="0" cellspacing="0">';
			
			for( let pageId in data )
			{
				let page = data[ pageId ];
				
				str += '<tr><td colspan="2" class="cPage"><p>Page, <strong>' + page.pageName + '</strong></p></td></tr>';
				
				if( page.elements )
				{
					for( let originalId in page.elements )
					{
						let element = page.elements[ originalId ];
						
						totals++;
						
						str += '<tr><td class="cQuestion" colspan="2"><p><strong>Question:</strong></p>' + element.question + '</td></tr>';
						
						if( element.choices.length )
						{
							let correctSet = false;
							let errorSet = false;
						
							for( let c = 0; c < element.choices.length; c++ )
							{
								let choice = element.choices[ c ];
								let cl = ( choice.isAnswer || choice.isCorrect ) ? ' class="cCorrect"' : ' class="cNotCorrect"';
							
								let answer = 'class="cAnswer"';
									
								if( element.answers[ md5( page.dataId + '_' + c ) ] )
								{
									answer = 'class="cSubmitted"';
									if( ( choice.isAnswer || choice.isCorrect ) && !correctSet )
									{
										correct++;
									}
									else if( !errorSet )
									{
										errors++;
									}
								}
								
								str += '<tr><td' + cl + '><p>Answer ' + ( c + 1 ) + ':</p></td><td ' + answer + '>' + choice.label + '</td></tr>';
							}
						}
					}
					
					/*let submittedValue = parseInt( data[a].Data );
					let dataId = data[a].DataID;
					let submittedName = data[a].ElementID;
					
					// Support checkboxes
					if( d.checkBoxes )
					{
						let correctSet = false;
						let errorSet = false;
						for( let b = 0; b < d.checkBoxes.length; b++ )
						{	
							let cl = d.checkBoxes[b].isAnswer ? ' class="cCorrect"' : ' class="cNotCorrect"';
							
							let answer = 'class="cAnswer"';

							if( md5( dataId + '_' + b ) == submittedName )
							{
								answer = 'class="cSubmitted"';
								if( d.checkBoxes[b].isAnswer && !correctSet )
								{
									correct++;
								}
								else if( !errorSet )
								{
									errors++;
								}
							}
							
							str += '<tr><td' + cl + '><p>Answer ' + ( b + 1 ) + ':</p></td><td ' + answer + '>' + d.checkBoxes[b].label + '</td></tr>';
						}
					}
					if( d.radioBoxes )
					{
						let correctSet = false;
						let errorSet = false;
						for( let b = 0; b < d.radioBoxes.length; b++ )
						{
							let cl = d.radioBoxes[b].isAnswer ? ' class="cCorrect"' : ' class="cNotCorrect"';
							
							let answer = 'class="cAnswer"';
							if( md5( dataId + '_' + b ) == submittedName )
							{
								answer = 'class="cSubmitted"';
								if( d.radioBoxes[b].isAnswer && !correctSet )
								{
									correct++;
									correctSet = true;
								}
								else if( !errorSet )
								{
									errors++;
									errorSet = true;
								}
							}
							
							str += '<tr><td' + cl + '><p>Answer ' + ( b + 1 ) + ':</p></td><td ' + answer + '>' + d.radioBoxes[b].label + '</td></tr>';
						}
					}*/
				}
			}
			
			//console.log( 'Ok, we should have the entire page now: ', data );
			//return;
			// List out
			/*for( let a = 0; a < data.length; a++ )
			{
				if( data[a].PageID != currentPage )
				{
					currentPage = data[a].PageID;
					str += '<tr><td colspan="2" class="cPage"><p>Page, <strong>' + data[a].PageName + '</strong></p></td></tr>';
				}
				if( data[a].Properties.substr( 0, 7 ) == 'BASE64:' )
				{
					totals++;
					let d = data[a].Properties.substr( 7, data[a].Properties.length - 7 );
					d = JSON.parse( Base64.decode( d ) );
					
					str += '<tr><td class="cQuestion" colspan="2"><p><strong>Question:</strong></p>' + d.question + '</td></tr>';
					
					let submittedValue = parseInt( data[a].Data );
					let dataId = data[a].DataID;
					let submittedName = data[a].ElementID;
					
					// Support checkboxes
					if( d.checkBoxes )
					{
						let correctSet = false;
						let errorSet = false;
						for( let b = 0; b < d.checkBoxes.length; b++ )
						{	
							let cl = d.checkBoxes[b].isAnswer ? ' class="cCorrect"' : ' class="cNotCorrect"';
							
							let answer = 'class="cAnswer"';

							if( md5( dataId + '_' + b ) == submittedName )
							{
								answer = 'class="cSubmitted"';
								if( d.checkBoxes[b].isAnswer && !correctSet )
								{
									correct++;
								}
								else if( !errorSet )
								{
									errors++;
								}
							}
							
							str += '<tr><td' + cl + '><p>Answer ' + ( b + 1 ) + ':</p></td><td ' + answer + '>' + d.checkBoxes[b].label + '</td></tr>';
						}
					}
					if( d.radioBoxes )
					{
						let correctSet = false;
						let errorSet = false;
						for( let b = 0; b < d.radioBoxes.length; b++ )
						{
							let cl = d.radioBoxes[b].isAnswer ? ' class="cCorrect"' : ' class="cNotCorrect"';
							
							let answer = 'class="cAnswer"';
							if( md5( dataId + '_' + b ) == submittedName )
							{
								answer = 'class="cSubmitted"';
								if( d.radioBoxes[b].isAnswer && !correctSet )
								{
									correct++;
									correctSet = true;
								}
								else if( !errorSet )
								{
									errors++;
									errorSet = true;
								}
							}
							
							str += '<tr><td' + cl + '><p>Answer ' + ( b + 1 ) + ':</p></td><td ' + answer + '>' + d.radioBoxes[b].label + '</td></tr>';
						}
					}
				}
			}*/
			
			str += '<tr><td colspan="2" class="cResults"><p><strong>Results:</strong></p></td></tr>';
			str += '<tr><td colspan="2" class="cSum"><p><em>Correct answers:</em> ' + correct + '</p><p><em>Wrong answers:</em> ' + errors + '</p><p><em>Score</em> ' + ( totals - errors ) + ' out of ' + totals + ' or ' + Math.floor( correct / totals * 100 ) + '%</p></td></tr>';
			
			str += '</table>';
			ge( 'ControllerContainer' ).innerHTML = str;
		}
		m.execute( 'appmodule', {
			appName: 'CourseCreator',
			command : 'submodule',
            vars    : {
                submodule   : 'classrooms',
                method      : 'getcontrollingsheet',
                userId      : msg.userId,
                classroomId : msg.classroomId
            },
		} );
	}
}
