$(".nav-wrapper ul li").click(function () {
   var id = $(this).attr("id");
   if(typeof id != "undefined"){
       var stringSubNav = "#nav-"+id;
       if(stringSubNav === "#nav-search"){
            $(".nav-wrapper>div").not(stringSubNav).hide();
            $(stringSubNav).toggle();
            $(this).find(".tabs").eq(0).css("height", "65px");
            $("#searchResults").empty();
            console.log(stringSubNav);

       }else{
           $(".nav-wrapper>div").not(stringSubNav).hide();
           $(stringSubNav).toggle()
           console.log(stringSubNav);
       }

   }
});