function render_commit_cell(cell, position) {
	var cell_val = cell.getValue();
	var authorship_metadata = cell.getRow().getData()[position]["record"]["payload"]["metadata"];
	var msg_subject = get_commit_subject(authorship_metadata["payload"]);
	var author_firstname = authorship_metadata["author"].split(" ")[0];

	return cell_val == null ? "" : sha1_link(cell_val) + " <b>" + author_firstname + ":</b> " + msg_subject;
}


function gen_breakages_table(element_id, data_url) {

	var table = new Tabulator("#" + element_id, {
		height:"300px",
		layout:"fitColumns",
		placeholder:"No Data Set",
		columns:[
			{title: "Action", columns: [
				{title:"X",
					headerSort: false,
					formatter: function(cell, formatterParams, onRendered){
					    return "<img src='/images/trash-icon.png' style='width: 16;'/>";
					},
					width:40,
					align:"center",
					cellClick:function(e, cell) {

						var cause_id = cell.getRow().getData()["start"]["db_id"];

						if (confirm("Realy delete cause #" + cause_id + "?")) {
							post_modification("/api/code-breakage-delete", {"cause_id": cause_id});
						}
					},
				},
				{title:"?",
					headerSort: false,
					formatter: function(cell, formatterParams, onRendered) {
						var cause_id = cell.getRow().getData()["start"]["db_id"];
						return link("<img src='/images/view-icon.png' style='width: 16;'/>", "/breakage-details.html?cause=" + cause_id);
					},
					width:40,
					align:"center",
				},
			]},
			{title: "Description", width: 250, field: "start.record.payload.description",
				editor: "input",
				cellEdited: function(cell) {
					var cause_id = cell.getRow().getData()["start"]["db_id"];
					var new_description = cell.getValue();


					var data_dict = {"cause_id": cause_id, "description": new_description};
					post_modification("/api/code-breakage-description-update", data_dict);
				},
			},
			{title: "Affected jobs", columns: [
				{title: "Count",
					width: 75,
					formatter: function(cell, formatterParams, onRendered) {
						var joblist = cell.getRow().getData()["start"]["record"]["payload"]["affected_jobs"];
						return joblist.length;
					},
				},
				{title: "Names", field: "start.record.payload.affected_jobs",
					tooltip: function(cell) {

						var cell_value = cell.getValue();
						return cell_value.join("\n");
					},
					formatter: function(cell, formatterParams, onRendered) {
						var cell_val = cell.getValue();
						var items = [];
						for (var jobname of cell_val) {
							items.push(jobname);
						}

						return items.join(", ");
					},
				},
			]},
			{title: "Start", columns: [
				{title: "commit", width: 300, field: "start.record.payload.breakage_commit.record",
					formatter: function(cell, formatterParams, onRendered) {
						return render_commit_cell(cell, "start");
					},
				},
				{title: "reported", width: 250, field: "start.record.created",
					formatter: function(cell, formatterParams, onRendered) {
						var val = cell.getValue();
						var start_obj = cell.getRow().getData()["start"];
						return moment(val).fromNow() + " by " + start_obj["record"]["author"];;
					},
				},
			]},
			{title: "End", columns: [
				{title: "commit", width: 300, field: "end.record.payload.resolution_commit.record",
					formatter: function(cell, formatterParams, onRendered) {
						return render_commit_cell(cell, "end");
					},
				},
				{title: "reported", width: 250, field: "end.record.created",
					formatter: function(cell, formatterParams, onRendered) {
						var val = cell.getValue();

						if (val) {
							var end_obj = cell.getRow().getData()["end"];
							return moment(val).fromNow() + " by " + end_obj["record"]["author"];
						}
						return "";
					},
				},
			]},
			{title: "Span", width: 100,
				headerSort: false,
				formatter: function(cell, formatterParams, onRendered) {

					var data_obj = cell.getRow().getData();
					var start_index = data_obj["start"]["record"]["payload"]["breakage_commit"]["db_id"];

					if (data_obj["end"]) {
						var end_index = data_obj["end"]["record"]["payload"]["resolution_commit"]["db_id"];
						var span_count = end_index - start_index;
						return span_count;
					} else {
						return "ongoing";
					}
				},
			},

		],
		ajaxURL: data_url,
/*		ajaxResponse: function(url, params, response) {
			return response.payload;
		},
*/
	});
}


function main() {
	gen_breakages_table("code-breakages-table", "/api/code-breakages");
}

