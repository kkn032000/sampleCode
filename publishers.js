var colNames = ['publisherId','legalName','status','country','stateProvince','city'];

function getPublisherDetails(id)
{
   return ajax('/csportal/publishers/getPublisherDetails', getSimpleRequestObject(id));
}

function getPublisherContacts(id)
{
   return ajax('/csportal/publishers/getPublisherContacts', getSimpleRequestObject(id));
}

function getPublisherServices(id)
{
   return ajax('/csportal/publishers/getPublisherServices', getSimpleRequestObject(id));
}

function updateServices(values, id)
{
   return ajax('/csportal/publishers/updateServices', getServiceRequestObject(values, id));
}

function getServiceRequestObject(values, id)
{
    var reqObj = {
       "body": {
         "serviceRows": values,
         "id": id
       }
    };
    return reqObj;
}

function setGridWidthHeight() {
    var mainGrid = jQuery("#list4");
    mainGrid.setGridWidth(jQuery("#DIV_PANEL2").width() - 2).setGridHeight(jQuery("#DIV_FILTER").height() - 96);
}

function handlePublisherCustomeValuesForFilter(elem, valuesForCategory) {
    if ('SEL_FILTER_COUNTRY' == elem.attr('id')) {
        var country = elem.val();
        if (country != null && country != 'all' && country != 'other') {
            valuesForCategory.push({'name': 'country', 'value': country });
            return true;
        }
    } else if ('SEL_FILTER_STATE' == elem.attr('id')) {
        var country = $("#SEL_FILTER_COUNTRY").val();
        var state = elem.val();
        if (country != null && country == "US" && state != 'all') {
            valuesForCategory.push({'name': 'state', 'value': state });
            return true;
        }
    } else if ('SEL_FILTER_PROVINCE' == elem.attr('id')) {
        var country = $("#SEL_FILTER_COUNTRY").val();
        if (country != null && country == "CA") {
            var province = elem.val();
            valuesForCategory.push({'name': 'state', 'value': province });
            return true;
        }
    } else if ('TEXT_INPUT' == elem.attr('id')) {
        var pubsearch = $("#SEL_FILTER_PUBLISHER").val();
        if (pubsearch != null && pubsearch == "publisherid") {
            var pubinput = elem.val();
            valuesForCategory.push({'name': 'publisherid', 'value': pubinput });
            return true;
        } else if (pubsearch != null && pubsearch == "name") {
            var pubinput = elem.val();
            valuesForCategory.push({'name': 'name', 'value': pubinput });
            return true;
        }
    } else if ('TEXT_INPUT_STATE' == elem.attr('id')) {
        var country = $("#SEL_FILTER_COUNTRY").val();
        if (country == null || country != "CA" || country != "US" || country != "all") {
            var stateprov = elem.val();
            valuesForCategory.push({'name': 'state', 'value': stateprov });
            if(country == "other"){
               valuesForCategory.push({'name': 'useCountryOther', 'value': "true" });
            }
            return true;
        }
    }
    return false;
}

function exp(t) {
    document.forms[0].method = 'POST';
    document.forms[0].action = 'publishers/export';
    document.forms[0].exptype.value = t;
    document.forms[0].submit();
}
function subgridCellFormatter(value, options, rData){
    if (value == true)
        return "&#10004;";
    else
        return Locale.getString('global.not.required');
}

function editTimeStampFormatter(value, options, rData){
    if (value == true)
        return Locale.getString('global.enabled');
    else
        return Locale.getString('global.disabled');
}

function expandSubGridRow(subgrid_id, row_id,updateSuccess) {
    var publisherId,response,mdata,mdataLength,serviceRowsStr,addr2="",addr3="",html="" ;
	var subgrid_table_id = "servicesGrid";
	jQuery(".subgrid-data").attr('colspan', (7)); // make expander occupy entire row
	publisherId = jQuery("#"+subgrid_id+"publisherId").text();
	if(!publisherId) {
	    publisherId = $(this).jqGrid("getCell", row_id, 'publisherId');
	}
	else {	
		response = getPublisherDetails(publisherId);
		mdata = response.serviceRows;
		mdataLength = mdata.length;
		var subGrid = jQuery("table[tname="+ publisherId + subgrid_table_id +"]"); 
		var subGridBody = subGrid.children("tbody");
		var headerRow = subGridBody.children("tr.jqgfirstrow");
		subGridBody.empty().append(headerRow);
     	for(var i = 0; i <= mdataLength; i++) {
		   jQuery("table[tname="+ publisherId + subgrid_table_id +"]").jqGrid('addRowData', i, mdata[i]);
		}
		if(updateSuccess) {
		        showExpanderMsg(publisherId,'success',Locale.getString('publisher.expander.success.update'));
				setTimeout(function(){clearExpanderMsg(publisherId);},5000);
			}	
		else {
				showExpanderMsg(publisherId,'error',Locale.getString('error.publisher.singing.service'));
		}	   
		return; 
	}
	response = getPublisherDetails(publisherId);
    mdata = response.serviceRows;
    mdataLength = mdata.length;
    if (!response.publisherdetail)
    {
        return;
    }
    var publisherName = response.publisherdetail.legalname;
    if (response.publisherdetail.addressline2 != null) {
      addr2 += "<div>" + response.publisherdetail.addressline2 + "</div>";
    }
    if (response.publisherdetail.addressline3 != null) {
      addr3 += "<div>" + response.publisherdetail.addressline3 + "</div>";
    }
    html = "<div class='publisher_expander'>" +
                  "<div class='editServiceMessage" + publisherId + "' style='display:none;'></div>" +
				  "<div class='statusMessage" + publisherId + " subGridFont statusMsg' style='display:none;'></div>" +
				  "<div id='publisher_expander_top'>" +
				        "<div id='publisher_expander_columnOne' class='subGridFont'>" +
					    "<div id='"+ subgrid_id + "publisherId' style='display:none;'>" + publisherId + "</div>" +
                        "<div id='corpTitle'>" + publisherName + "</div>" +
                        "<div>" + response.publisherdetail.addressline1 + "</div>" +
                            addr2 +
                            addr3 +
                        "<div>" + response.publisherdetail.stateprovince + "</div>" +
                        "<div>" + response.publisherdetail.zipcode + "</div>" +
                        "<div>" + response.publisherdetail.phonenumber + "</div>" +
                        "</div>" +
                        "<div id='publisher_expander_divider1'> </div>" +
                        "<div id='publisher_expander_columnTwo'>" +
                            "<div id='subGridTitle'>"+ Locale.getString('publisher.signing.service.title') +"</div>" +
							 "<div id='noSignServicesLabel"+ publisherId +"' style='display:none'>"+ Locale.getString('publisher.no.signing.services') +"</div>" +
                            "<table tname='"+ publisherId + subgrid_table_id +"' id ='" + subgrid_table_id + "'></table>" +
                        "</div>" +
                    "</div>" +
                    "<div class='linkSection'>"  +
                    "<div id='contactsLink" + publisherId + "' class='contactsLink'><a href='javascript:void(0)'>" + Locale.getString('publisher.expander.contactslink') + "</a></div>" ;
	
	if(jQuery("#adminRole").length > 0 && isActive(publisherId,'servicesGrid')) {
            html += "<div id='editServicesLink" + publisherId + "'><a href='javascript:void(0)'>" + Locale.getString('publisher.expander.admin.editserviceslink') + "</a></div>" ;
	}	
	else {
        html += "<div id='editServicesLink" + publisherId + "'><a href='javascript:void(0)'>" + Locale.getString('publisher.expander.monitor.editserviceslink') + "</a></div>" ;
    }              
	html +=     "</div>" +
                "</div>" ;

    jQuery("#" + subgrid_id).append(html);
    
	if(mdataLength > 0) 
	{   jQuery('#noSignServicesLabel'+ publisherId).hide();
	    jQuery('#editServicesLink' + publisherId).show();
		jQuery("table[tname="+ publisherId + subgrid_table_id +"]").jqGrid({
				colNames: [Locale.getString('publisher.service.column.title'), Locale.getString('publisher.requires.testing.column.title'), Locale.getString('publisher.timestamp.column.title')],
				colModel: [	{name:"name",index:"name",key:true,sortable:false, width: 200, resizable:false},
							{name:'testrequired',index:'testrequired', sortable:false,align:"center", formatter : subgridCellFormatter, resizable:false},
							{name:"timestamp",index:"timestamp", sortable:false, align:"center", formatter : subgridCellFormatter, resizable:false}
				],
				datatype: 'local',
				rowNum:20,
				sortname: 'num',
				sortorder: "asc",
				height: 88
		});
		jQuery("table[tname="+ publisherId + subgrid_table_id +"]").jqGrid("setLabel","name","",{"text-align":"left"});  
		var subJQGrid=jQuery("table[tname="+ publisherId + subgrid_table_id +"]");
		for(var i = 0; i <= mdataLength; i++) {
		   subJQGrid.jqGrid('addRowData', i, mdata[i]);
		}   
	}
	else {
	    jQuery('#noSignServicesLabel'+ publisherId).show();
		jQuery('#editServicesLink' + publisherId).hide();
	}
	jQuery("#contactsLink" + publisherId).click(function (event) {
		showContactDetails(publisherId,publisherName);
	}); 
    jQuery("#editServicesLink" + publisherId).click(function (event) {
		showEditServices(publisherId,publisherName,subgrid_id, row_id);
	});
	showStatusInfoMsg(publisherId,subgrid_table_id);
}

function isActive(publisherId,subgrid_table_id) { 
    var mainGrid = jQuery('#list4');
    var selectedRow = mainGrid.jqGrid('getGridParam', 'selrow');
    var statusVal = mainGrid.jqGrid('getCell', selectedRow, 'status'); 
	if(statusVal.toUpperCase() == 'INACTIVE') {
	    return false;		
	}
	return true;
}

function showStatusInfoMsg(publisherId,subgrid_table_id) { 
    var mainGrid = jQuery('#list4');
    var selectedRow = mainGrid.jqGrid('getGridParam', 'selrow');
    var statusVal = mainGrid.jqGrid('getCell', selectedRow, 'status'); 
	if(statusVal.toUpperCase() == 'PENDING') {
	    jQuery('.statusMessage'+publisherId).text(Locale.getString('publisher.expander.pending.msg')).show();
	}
	else if(statusVal.toUpperCase() == 'INACTIVE') {
	   	jQuery('.statusMessage'+publisherId).text(Locale.getString('publisher.expander.inactive.msg')).show();
	}
}

function clearWarning() { 
    jQuery(".editServiceWarning").symMessaging('clear',{}); 
}
function showWarning() { 
    jQuery(".editServiceWarning").symMessaging('alert', { message: Locale.getString('publisher.editsignservices.warning') } ); 
}
function clearExpanderMsg(publisherId) { 
    jQuery(".editServiceMessage"+publisherId).symMessaging('clear',{});
}
function showExpanderMsg(publisherId,type,msg) { 
    jQuery(".editServiceMessage"+publisherId).symMessaging(type, { message: msg } ); 
}

function checkForAllDisabledServices(gridId) {
    var colval = jQuery(gridId).getCol('enabled');
		for(var i=0;i<colval.length;i++) {
		    if(colval[i] == 'true') {
                clearWarning();
				return true;
			}			
		    else if (i ==  colval.length-1) {
			    clearWarning();
			    showWarning();
				return false;
			}
		} 
}
function updateEditServices(publisherId,subgrid_id, row_id, servicesData) {
    try {   
        clearExpanderMsg(publisherId);
		var serviceRows = "", modified = false, sDataLength = servicesData.length;
		var rows= jQuery('#editableServicesGrid').getRowData();
		serviceRows = JSON.stringify(rows);
		serviceRows = serviceRows.replace(/Enabled/g, 'true').replace(/Disabled/g, 'true').replace(/\"true\"/g, 'true').replace(/\"false\"/g, 'false').replace(/\"/g, "\'");
		for(var i=0;i<sDataLength;i++) {
		    if(servicesData[i].enabled != (rows[i].enabled == 'true') || servicesData[i].testrequired != (rows[i].testrequired == 'true')) {
                modified = true;
                break;
            }				
		}
		if(modified) {
			var response = updateServices(serviceRows,jQuery('#pubId').text()) ;
			if(response.responseStatus && response.responseStatus.type == 'error') {
				expandSubGridRow(subgrid_id, row_id,false);			
			} 
			else {
				expandSubGridRow(subgrid_id, row_id,true);
			}
		}
	}
    catch(error) {  
	    showExpanderMsg(publisherId,'error',Locale.getString('error.publisher.singing.service'));
    }	
}
	
function showEditServices(publisherId,publisherName,subgrid_id, row_id) {
   try {
        clearExpanderMsg(publisherId);
        var html = "";
	    jQuery("#DIV_EDIT_SERVICES_SECTION").empty();
		jQuery("#DIV_UPDATE_SERVICES_SECTION").empty(); 
	    var response = getPublisherServices(publisherId);
		var servicesData = response.serviceRows;
        var servicesDataLength = servicesData.length;
	    var edit_subgrid_id = "editableServicesGrid";
		html = "<div id='pubId' style='display:none;'>"+publisherId+"</div>"
		html += "<div class='expSubSection'>" +
		            "<div class='expPublisherHeading'>"+ Locale.getString('publisher.expander.publisher.heading') + "</div>" +
                    "<div class='expPublisherName'>"+ publisherName + "</div>" +					
                    "<div id='subGridTitle'>"+ Locale.getString('publisher.signing.service.title') + "</div>" +
                    "<table tname='"+ publisherId + edit_subgrid_id +"' id ='" + edit_subgrid_id + "'></table>" +
                "</div>" 
			
		jQuery("#DIV_EDIT_SERVICES_SECTION").append(html); 
		
		if(jQuery("#adminRole").length > 0 && isActive(publisherId,'servicesGrid')) {
		    columnModel = [	{name:"name",index:"name",key:true,sortable:false, width: 200, resizable:false, align:"left"},
			            {name:"id",index:"id",key:true,hidden:true},   
			            {name:"enabled", index:"enabled", align:"center", sortable:false, resizable:false, editable:true, edittype:'checkbox', editoptions: {value:'true:false'}, 
                            formatter: "checkbox", formatoptions: {disabled : false}},
                        {name:'testrequired',index:'testrequired', sortable:false, align:"center", resizable:false, editable:true, edittype:'checkbox', editoptions: { value:'true:false'}, 
                            formatter: "checkbox", formatoptions: {disabled : false}},
						{name:"timestamp",index:"timestamp", sortable:false, align:"center", formatter : editTimeStampFormatter, resizable:false}	
            ];
		} 
		else {	
		    columnModel = [	{name:"name",index:"name",key:true,sortable:false, width: 200, resizable:false},	
                        {name:"id",index:"id",key:true,hidden:true},		
						{name:"enabled", index:"enabled", align:"center", sortable:false, formatter : subgridCellFormatter, resizable:false},
						{name:'testrequired',index:'testrequired', sortable:false, align:"center", formatter : subgridCellFormatter, resizable:false},
						{name:"timestamp",index:"timestamp",sortable:false, align:"center", formatter : subgridCellFormatter, resizable:false}
				]	
		}
		jQuery("table[tname="+ publisherId + edit_subgrid_id +"]").jqGrid({
            colNames: [Locale.getString('publisher.service.column.title'),'Id', Locale.getString('publisher.enable.column.title'), Locale.getString('publisher.requires.testing.column.title'), Locale.getString('publisher.timestamp.column.title')],
            colModel: columnModel,
			datatype: 'local',
            sortname: 'num',
            sortorder: "asc",
            height: 158 	
        });
	var editJQsubGrid = jQuery("table[tname="+ publisherId + edit_subgrid_id +"]");	
    editJQsubGrid.jqGrid("setLabel","name","",{"text-align":"left"}); 
    for(var i = 0; i <= servicesDataLength; i++) {
       editJQsubGrid.jqGrid('addRowData', i, servicesData[i]);
	} 
	if(jQuery("#adminRole").length > 0 && isActive(publisherId,'servicesGrid')) {
		jQuery("#DIV_EDIT_SERVICES .buttonRow").empty();
		checkForAllDisabledServices("table[tname="+ publisherId + edit_subgrid_id +"]");
		jQuery("#DIV_EDIT_SERVICES").symDialog({ title: '',
					applyButtonText: Locale.getString('details.button.save'),
					cancelButtonText: Locale.getString('details.button.cancel'),
					height: 450,
					width: 715,
					onApply: function() {
						updateEditServices(publisherId,subgrid_id, row_id,servicesData);	
                        jQuery("#DIV_EDIT_SERVICES").dialog('close');   						
					}					
		});	
    }
    else {
	    jQuery("#DIV_EDIT_SERVICES .buttonRow").empty();
	    jQuery("#DIV_EDIT_SERVICES").symDialog({
                applyButtonText: Locale.getString('details.button.close'),
                wantCancel: false,
                title: '',
                height: 450,
				width: 715
    }); 
    }
	if(jQuery("#adminRole").length > 0) { 
		jQuery("td[aria-describedby='editableServicesGrid_enabled'] input").each(function(){    
			    jQuery(this).bind('change', function(e) {
				    checkForAllDisabledServices("table[tname="+ publisherId + edit_subgrid_id +"]");	
				});
		});	            																							
	}
	jQuery("#DIV_EDIT_SERVICES").dialog("open");
	} 
	catch(error) {  
	    showExpanderMsg(publisherId,'error',Locale.getString('error.publisher.singing.service'));
    }
}

function showContactDetails(publisherId,publisherName) {
    try {
	    var html = "";
		clearExpanderMsg(publisherId);
		jQuery("#DIV_CONTACTS_SECTION").empty();
	    var response = getPublisherContacts(publisherId);
		var contactsLength = response.contacts.length;
		for(var i=0;i<contactsLength;i++) {
		            if(i == 0) {
				        html += "<div class='viewContModalPubName'> " + Locale.getString('publisher.contact.title') +  " " + publisherName + "</div>";
					}	
				    if(i%2 == 0) {
					    if(i != response.contacts.length-1) {
						    html+= "<div class='contactSection subGridFont'>";
						}	
				        html += "<div class='contactEven subGridFont'>";
					}
                    else {   
                        html += "<div class='contactOdd subGridFont'>";					
					}								
					html+=	"<div class='viewContModalContType'>" + Locale.getString(response.contacts[i]['contactType']) + "</div>" +
							"<div>" + response.contacts[i]['firstName'] + " " + response.contacts[i]['lastName'] + "</div>" +
							"<div>" + response.contacts[i]['email'] + "</div>" +
							"<div>" + response.contacts[i]['phone'] + "</div>" +
							"<div style='margin-top:5px;'>" + response.contacts[i]['address1'] + "</div>" +
							"<div>" + response.contacts[i]['address2'] + "</div>" +
							"<div>" + response.contacts[i]['stateProv'] + "</div>" +
							"<div>" + response.contacts[i]['postalCode'] + "</div>" +
							"<div>" + response.contacts[i]['country'] + "</div>" +
						    "</div>"
			        if(i%2 !=0) {
					    html+= "</div>";
						if(i != response.contacts.length-1) {
						    html+= "<div class='horDivider'></div>"; 
						}	
					}	
		}
		jQuery("#DIV_CONTACTS_SECTION").append(html);
		jQuery("#DIV_CONTACTS_DETAIL").dialog("open");
	} 
	catch(error){
	    showExpanderMsg(publisherId,'error',Locale.getString('error.publisher.contact.details'));
	} 
}
function initContactsDialog() {
    jQuery("#DIV_CONTACTS_DETAIL").symDialog({
                cancelButtonText: Locale.getString('details.button.close'),
                wantApply: false,
                title: '',
                height: 450
    });   
}

function isValid() {    
    var mainGridMsg = jQuery(".mainGridMsg");
    var mainGridSection = jQuery(".mainGridSection");  
    mainGridMsg.symMessaging('clear',{}); 
    mainGridMsg.hide();
	mainGridSection.show();		
    if(jQuery('#SEL_FILTER_PUBLISHER').val() == 'all') {
	    if (!($('#CHECK_ACTIVE').is(':checked')) && !($('#CHECK_INACTIVE').is(':checked')) &&  !($('#CHECK_PENDING').is(':checked')) ) {              			
		    mainGridMsg.symMessaging('alert', { message: Locale.getString('publisher.maingrid.norecords.msg') } ); 
			mainGridSection.hide();
			managerAPI.mask.hide("grid");  
            return false;
		}
	} 	
	if(jQuery('#SEL_FILTER_PUBLISHER').val() == 'publisherid') {
	    var pubId = jQuery("#TEXT_INPUT").val();
		jQuery('.fPubValMsg').hide();
		if( Math.floor(pubId) == pubId && jQuery.isNumeric(pubId)) {
		    return true;
        }
		else {
		    jQuery('.fPubValMsg').show();
            return false;		
		}	
    }	
    return true;	
}     
jQuery(function () {
    jQuery.jgrid.formatter.integer = {thousandsSeparator: ","};
    var mainGrid = jQuery("#list4");
    jQuery("#DIV_FILTER").symFilter('getFilter');
    jQuery("#DIV_FILTER").symFilter({
        searchButtonText: 'panel.search.search',
        onSearch: function () {
		    if(isValid()) {
                mainGrid.setGridParam({page:0}).trigger("reloadGrid");
			}	
        },
        handleControlCustomValue  : function(elem, valuesForCategory) {
            return handleDateRangeForFilter(elem, valuesForCategory, 'SEL_LAST_UPDATE_RANGE') || handlePublisherCustomeValuesForFilter(elem, valuesForCategory);
        }
    });
    jQuery("#SEL_LAST_UPDATE_RANGE").symDateRange();
	jQuery("#SEL_LAST_UPDATE_RANGE").val('-7');
	jQuery("#SEL_FILTER_COUNTRY").change(function(event) {jQuery("#TEXT_INPUT_STATE").val("");});
	//jQuery("#SEL_LAST_UPDATE_RANGE").change(function(event) {jQuery("#TEXT_SEL_LAST_UPDATE_RANGE_TO,#TEXT_SEL_LAST_UPDATE_RANGE_FROM").val("");});
											
    mainGrid.jqGrid({
        datatype: "json",
        jsonReader: {
            repeatitems: false
        },
        postData: {
            filter: function() {
			    $('.loading').remove();
			    managerAPI.mask.show({ key: "grid", target: $("#DIV_PANEL2"), maskType: "relative" });
                var val = jQuery("#DIV_FILTER").symFilter('getFilter');
				return JSON.stringify(val);
            }
        },
        url: "publishers/list",		
		loadComplete: function(data) {
                managerAPI.mask.hide("grid");
		},  
        mtype: "post",
        rowNum: 50,
        recordpos: "right",
        viewrecords: true,
        pager: "#pager",
        pginput: false,
		sortname: 'status',
        sortorder: "asc",
        pagerpos: "left",
        toppager: true,
        colNames: [Locale.getString('publisher.id.column.title'), Locale.getString('publisher.name.column.title'), Locale.getString('publisher.status.column.title'), Locale.getString('publisher.country.column.title'), Locale.getString('publisher.state.column.title'), Locale.getString('publisher.city.column.title'), Locale.getString('publisher.date.created.column.title')],
        colModel:[
            {name:'publisherId',index:'publisherId', width:80, sortable: false, align:"left"},
            {name:'legalName',index:'legalName', width:100, align:"left"},
            {name:'status',index:'status', width:80, align:"left"},
            {name:'country',index:'country', width:80, align:"left"},
            {name:'stateProvince',index:'stateProvince', width:120, align:"left"},
            {name:'city',index:'city', width:70, align:"left" },
            {name:'createdDate',index:'createdDate', width:120, formatter: dateFormatter,align:"center"}
        ],
        multiselect: false,
        autowidth: true,
        subGrid: true,
		beforeProcessing: function(data) {
		    var mainGridMsg = jQuery(".mainGridMsg");
			var mainGridSection = jQuery(".mainGridSection");
			mainGridMsg.symMessaging('clear',{});            			
			if((typeof data.response != 'undefined' && data.response.responseStatus.type == 'error') || data.records == 0) {			   
				mainGridMsg.symMessaging('alert', { message: Locale.getString('publisher.maingrid.norecords.msg') } ); 
				mainGridSection.hide();
				managerAPI.mask.hide("grid");
			    return false;
			}
            else {
			    mainGridMsg.symMessaging('clear',{}); 
			    mainGridMsg.hide();
			    mainGridSection.show();				
			}
		},
        onSelectRow: function (rowid) {
            $(this).jqGrid("toggleSubGridRow", rowid);
        },
        gridComplete: function() {
            setGridWidthHeight();
			var rCount=mainGrid.jqGrid('getGridParam', 'records');
			jQuery('.mainGridTitle').text(Locale.getString('publisher.contact.title')+ " " +rCount );
        },
        subGridRowExpanded: expandSubGridRow,
        caption: ""
    });
	var colNamesLength = colNames.length;
	for(var j=0;j<colNamesLength;j++) {
	    mainGrid.jqGrid("setLabel", colNames[j],"",{"text-align":"left"});  
	}
	
    mainGrid.jqGrid("setLabel","createdDate","",{"text-align":"center"}); 
    mainGrid.jqGrid('hideCol', 'subgrid');
    mainGrid.navGrid("#pager", {search: false, edit:false, add:false, del:false, cloneToTop:true, refresh:false, position:"center" })
            .navSeparatorAdd("#pager");
    mainGrid.navGrid("#list4_toppager_center", {search: false, edit:false, add:false, del:false, refresh:false})
            .navSeparatorAdd("#list4_toppager_center");
  
	jQuery('.ui-paging-info').each(function(index) {
                if(index == 0) {              
			        jQuery("<td id='pagingTopInfo'></td>").insertAfter(jQuery('#prev_t_list4_toppager'));
					jQuery('#pagingTopInfo').html(jQuery(this));
                } else {
				    jQuery("<td id='pagingInfo'></td>").insertAfter(jQuery('#prev_pager'));
					jQuery('#pagingInfo').html(jQuery(this));
				}
            });
	
	jQuery(window).bind('resize',
            function() {
                setGridWidthHeight();
            }).trigger('resize');

    jQuery("#MAIN_FRAME").mainFrame({
        title: 'title.publishers',
        iconClass: 'icoPublishersPageHeader',
        closeButtonTitle : 'panelicon.close'
    });
   
	jQuery("#SEL_FILTER_COUNTRY").change(function (event) {
        if(jQuery(this).val() == "US") { 
			jQuery(".stateLabel,#SEL_FILTER_STATE").show();
			jQuery("#SEL_FILTER_STATE").val('all');
			jQuery(".provinceLabel,#SEL_FILTER_PROVINCE,label[for='TEXT_INPUT_STATE'],#TEXT_INPUT_STATE").hide();
		} else if(jQuery(this).val() == "CA") { 
		    jQuery(".stateLabel,label[for='TEXT_INPUT_STATE'],#TEXT_INPUT_STATE,#SEL_FILTER_STATE").hide();
			jQuery(".provinceLabel,#SEL_FILTER_PROVINCE").show();
			jQuery("#SEL_FILTER_PROVINCE").val('all');
		} else if(jQuery(this).val() == "all") { 
		    jQuery(".stateLabel,#SEL_FILTER_STATE,.provinceLabel,#SEL_FILTER_PROVINCE,label[for='TEXT_INPUT_STATE'],#TEXT_INPUT_STATE").hide();
		} else {
		    jQuery(".stateLabel,#SEL_FILTER_STATE,.provinceLabel,#SEL_FILTER_PROVINCE").hide();
			jQuery("label[for='TEXT_INPUT_STATE'],#TEXT_INPUT_STATE").show(); 
        } 		
    });
	
	jQuery("#SEL_FILTER_PUBLISHER").change(function (event) {
        var iLabel = jQuery("label[for='TEXT_INPUT'],#TEXT_INPUT");
		var countrySec = jQuery("#SEL_FILTER_COUNTRY,.countryLabel"); 
		var stateSec = jQuery("#SEL_FILTER_STATE,.stateLabel,#TEXT_INPUT_STATE,label[for='TEXT_INPUT_STATE'],#SEL_FILTER_PROVINCE,.provinceLabel"); 
		jQuery('.fPubValMsg').hide(); 
		jQuery("#TEXT_INPUT").val("");
		if(jQuery(this).val() == "all") { 
			countrySec.show();
		    iLabel.hide();
			jQuery('#SEL_FILTER_COUNTRY').val('all');
			stateSec.hide();
		} 
		else if(jQuery(this).val() == "publisherid") { 
			countrySec.hide();
			iLabel.show();
			utils.addWaterMark(Locale.getString('publisher.filter.watermark.pubId'),'TEXT_INPUT');
			stateSec.hide();
		}
		else if(jQuery(this).val() == "name"){
		    iLabel.show();
			countrySec.show();
			stateSec.hide();
			utils.addWaterMark(Locale.getString('publisher.filter.watermark.pubName'),'TEXT_INPUT');
			jQuery('#SEL_FILTER_COUNTRY').val('all');
		}
	});
	
	jQuery("label[for='TEXT_INPUT']").click(function (event) {
	    jQuery("#TEXT_INPUT").val(''); 
		jQuery(".fPubValMsg").hide();
	});
	
	jQuery("label[for='TEXT_INPUT_STATE']").click(function (event) {
	    jQuery("#TEXT_INPUT_STATE").val(''); 
	});
		 
	jQuery("#DIV_PANEL1_GAP").panelGap();
	initContactsDialog();	
});
