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
			let data = JSON.parse( md );
			
			let str = '<table border="0" cellspacing="1" cellpadding="8" bgcolor="#c0c0c0">';
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
					str += '<tr><td colspan="3"><p><strong>' + data[a].PageName + '</strong></p></td></tr>';
				}
				if( data[a].Properties.substr( 0, 7 ) == 'BASE64:' )
				{
					totals++;
					let d = data[a].Properties.substr( 7, data[a].Properties.length - 7 );
					d = JSON.parse( Base64.decode( d ) );
					
					str += '<tr><td bgcolor="#f8f8f8" colspan="2"><p>Question:</p>' + d.question + '</td></tr>';
					
					let submittedValue = parseInt( data[a].Data );
					let dataId = data[a].DataID;
					let submittedName = data[a].ElementID;
					
					// Support checkboxes
					if( d.checkBoxes )
					{
						for( let b = 0; b < d.checkBoxes.length; b++ )
						{	
							let cl = d.checkBoxes[b].isAnswer ? ' bgcolor="#ffaacc" color="black"' : ' bgcolor="#ffffff"';
							
							let answer = 'bgcolor="#ffffff"';

							if( md5( dataId + '_' + b ) == submittedName )
							{
								answer = 'bgcolor="#aa0000" class="Submitted"';
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
							let cl = d.radioBoxes[b].isAnswer ? ' bgcolor="#ffaacc" color="black"' : ' bgcolor="#ffffff"';
							
							let answer = 'bgcolor="#ffffff"';
							if( md5( dataId + '_' + b ) == submittedName )
							{
								answer = 'bgcolor="#aa0000" class="Submitted"';
								if( d.radioBoxes[b].isAnswer )
								{
									correct++;
								}
								else
								{
									errors++;
								}
							}
							
							str += '<tr><td' + cl + '><p>Answer ' + ( b + 1 ) + ':</p></td><td  ' + answer + '>' + d.radioBoxes[b].label + '</td></tr>';
						}
					}
				}
			}
			
			str += '<tr><td colspan="2"><p><strong>Results:</strong></p></td></tr>';
			str += '<tr><td colspan="2">Correct: ' + correct + ' Wrong: ' + errors + ' (Score ' + ( totals - errors ) + ' out of ' + totals + ' or ' + Math.floor( correct / totals * 100 ) + '%)</td></tr>';
			
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
