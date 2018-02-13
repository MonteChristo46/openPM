console.log("Vue.js script included");
// noinspection JSAnnotator
new Vue({
    el: "#vueContainer",
    delimiters: ['[[', ']]'], //Need to change delimiters {{}} to [[]] because {{}} is used by flask jinja2
    data: {
        processName: "Example Process",
        label: "",
        labels: [],
        searchTerm: "",
        searchResults: []
    },
    methods: {
        search: function () {
            this.searchResults = []
            var searchResults = this.searchResults;
            $("#searchResults").empty();
            $("#nav-search").find(".tabs").eq(0).css("height", "65px");
            $.ajax({
                url: '/search/' + this.searchTerm,
                type: 'post',
                success: function (response) {
                    response = JSON.parse(response);
                    $("#searchResults").append("Results: " + response.length);
                    if (response.length > 0) {
                        $("#nav-search").find(".tabs").eq(0).css("height", "200px");
                        for (var i = 0; i <= response.length; i++) {
                            console.log(response[i]);
                            searchResults.push(response[i])
                        }
                    }

                }
            });
            this.searchResults = searchResults
        },
        ajax: function () {
            this.processName = document.getElementById("inputProcessName").value;
            var file = $("#fileInput").prop("files")[0];
            var form_data = new FormData();
            form_data.append('file', file);
            form_data.append("processName", name);
            form_data.append("labels", this.labels);

            $.ajax({
                url: '/upload',
                cache: false,
                contentType: false,
                processData: false,
                data: form_data,
                type: 'post',
                success: function (response) {
                    alert(response);
                    console.log(response);
                    if (response === "File has been uploaded") {
                        //minimalForceDirectedGraph();
                        drawProcessFlow();
                    }
                }
            });

        },
        ajaxByFileName: function () {
            this.processName = document.getElementById("inputProcessName").value; //href value
            var form_data = new FormData();
            form_data.append("processName", name);


            $.ajax({
                url: '/upload', //data -> with parameter. We dont want to destroy the global path
                cache: false,
                contentType: false,
                processData: false,
                data: form_data,
                type: 'post',
                success: function (response) {
                    alert(response);
                    console.log(response);
                    //Das kann weg
                    if (response === "File has been uploaded") {
                        minimalForceDirectedGraph();
                    }
                }
            });

        },
        addLabel: function () {

            if (this.labels.length <= 3) {
                this.labels.indexOf(this.label)
                if (this.labels.length === 0) {
                    this.labels.push(this.label)
                } else if (this.labels.indexOf(this.label) <= -1) {
                    this.labels.push(this.label)
                }
            }
            else {
                alert("Sorry, just four labels allowed at the moment.")
            }
        },
        removeLabel: function () {
            console.log("hello");
            console.log(this.labels.length);
            this.labels.splice((this.labels.length - 1), 1)
        }
    }
});