$("#upload").click(function () {
    $("#navUpload").toggle();
});

$("#search").click(function () {
    $("#navSearch").toggle();
    $("#navSearch").find(".tabs").eq(0).css("height", "65px");
    $("#searchResults").empty();
});

