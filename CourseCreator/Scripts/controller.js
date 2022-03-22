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
			let data = cl.Data;
			
			let str = '<h2>' + cl.Name + '</h2>';
			str += '<table border="0" cellspacing="0">';
			let currentPage = -1;
			
			// To measure
			let correct = 0;
			let errors = 0;
			let totals = 0;
			
			for( let a = 0; a < data.length; a++ )
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
						for( let b = 0; b < d.checkBoxes.length; b++ )
						{	
							let cl = d.checkBoxes[b].isAnswer ? ' class="cCorrect"' : ' class="cNotCorrect"';
							
							let answer = 'class="cAnswer"';

							if( md5( dataId + '_' + b ) == submittedName )
							{
								answer = 'class="cSubmitted"';
								if( d.checkBoxes[b].isAnswer )
								{
									correct++;
								}
								else
								{
									errors++;
								}
							}
							
							str += '<tr><td' + cl + '><p>Answer ' + ( b + 1 ) + ':</p></td><td ' + answer + '>' + d.checkBoxes[b].label + '</td></tr>';
						}
					}
					if( d.radioBoxes )
					{
						for( let b = 0; b < d.radioBoxes.length; b++ )
						{
							let cl = d.radioBoxes[b].isAnswer ? ' class="cCorrect"' : ' class="cNotCorrect"';
							
							let answer = 'class="cAnswer"';
							if( md5( dataId + '_' + b ) == submittedName )
							{
								answer = 'class="cSubmitted"';
								if( d.radioBoxes[b].isAnswer )
								{
									correct++;
								}
								else
								{
									errors++;
								}
							}
							
							str += '<tr><td' + cl + '><p>Answer ' + ( b + 1 ) + ':</p></td><td ' + answer + '>' + d.radioBoxes[b].label + '</td></tr>';
						}
					}
				}
			}
			
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
