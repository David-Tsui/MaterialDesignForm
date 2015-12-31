$(document).ready(function() {
	$("form").submit(function() { return false; });
	$('#date-start, #date-end').bootstrapMaterialDatePicker({
    weekStart: 0, 
    format: 'YYYY/MM/DD HH:mm',
    cancelText: "取消",
    okText: "送出",
    lang: "zh_TW"
  });
	$('#date-start').on('change', function(e, date) {
		$('#date-end').bootstrapMaterialDatePicker('setMinDate', date);
	});

	$("button").focus(function(e) {
		$(this).blur();
	});

  $("input[name='group1']").click(function() {
    var start_val = $("#date-start").val(), end_val = $("#date-end").val();
    if (start_val != "" && end_val != "") {
      var start_date = generateDateObj(start_val), end_date = generateDateObj(end_val);
      var time = calculateTime(getBusinessName(getRadioValue("group1")), start_date, end_date);
      $("#total-hour").val(time);
      $("#total-day").val(time / 8.5);
    }
  });

  $("#group1_6").click(function() { $("#place").val("總公司支援組").removeClass("invalid"); });

  $("#date-end").change(function() {
    var end_val = $(this).val();
    var start_val = $("#date-start").val();
    if (end_val != "" && start_val != "") {
      var start_date = generateDateObj(start_val), end_date = generateDateObj(end_val);
      var time = calculateTime(getBusinessName(getRadioValue("group1")), start_date, end_date);
      $("#total-hour").val(time);
      $("#total-day").val(time / 8.5);
    }
  });

  $("#date-start").change(function() {
    //console.log("start changed");
    var start_val = $(this).val();
    //console.log("start_val: " + start_val);
    var end_val = $("#date-end").val();
    if (end_val != "" && start_val != "") {
      var start_date = generateDateObj(start_val), end_date = generateDateObj(end_val);
      var time = calculateTime(getBusinessName(getRadioValue("group1")), start_date, end_date);
      $("#total-hour").val(time);
      $("#total-day").val(time / 8.5);
    }
  });


	$("#submitBtn").click(function() {
    var api_url = "https://script.google.com/macros/s/AKfycbxWwdr-Dcra-BVeat6w-fVDvwTh3w9nJKYT0rCjLsAz7231OSY/exec";
    if (checkForm()) {
      var business_name = getBusinessName(getRadioValue("group1"));
      var start_date = $("#date-start").val(), end_date = $("#date-end").val();
      var total_time = calculateTime(business_name, generateDateObj(start_date), generateDateObj(end_date));
  		var formData = {
  			時間戳記: new Date().yyyyMMddhhmm(),
  			經銷商別: business_name,
  			廠別: getFactoryName(getRadioValue("group1"), $("#place").val()),
  			職稱: $("#position").val(),
  			姓名: $("#name").val(),
  			起始日期: start_date,
  			結束日期: end_date,
  			共計時數: total_time,
  			換算天數: total_time / 8.5,
  			假別: getRadioValue("group4"),
  			事由: $("#reason").val(),
  			廠長核准: getRadioValue("group6"),
  			請假方式: getRadioValue("group7"),
        核准: "同意",
        未核准原因: "",
        代理人員: $("#proxy").val()
  		};
      console.log(formData);
      $.post(api_url, formData, function(response) {
        console.log(response);
      });
    } 
	});
});

Date.prototype.yyyyMMddhhmm = function() {
  var yyyy = this.getFullYear();
  var MM = (this.getMonth()+1); // getMonth() is zero-based
  var dd = this.getDate();
  var hh = this.getHours();
  var mm = this.getMinutes();
  return yyyy + "/" + MM + "/" + dd + " " + hh + ":" + mm; // padding
};

function getRadioValue(formID) {
  var checked_radio = $("#" + formID + " input[type='radio']:checked");
  var ret = checked_radio.val();
  if (ret == "其他") 
    ret = checked_radio.siblings(".input-field").find("input[type='text']").val();
  return ret;
}

function getBusinessName(name) {
  if (name == "誠隆" || name == "裕信" || name == "鼎隆" || name == "總公司支援組") 
    return "CARSPA";
  return name;
}

function getFactoryName(b_name, f_name) {
  if (b_name == "誠隆" || b_name == "裕信" || b_name == "鼎隆") 
    return b_name + f_name;
  return f_name;
}

function generateDateObj(date){
  if (date == "") return;
  var ret = "";
  var temp = date.split(" ");
  var date_part = temp[0], time_part = temp[1];
  time_part = time_part.split(":");
  date_part = date_part.replace(/\//g, "-");

  time_part = parseInt(time_part[0], 10) + parseInt(time_part[1], 10) / 60;
  ret = {
    date: date_part, // 2015-7-13
    time: time_part  // 8 || 8.5
  }; 
  return ret;
}

function calculateTime(factory, start, end) {
  var factory_obj = {
    CARSPA: {
      day_on: 8.5,
      day_off: 18,
      lunch_start: 12,
      lunch_end: 13,
      lunch_time: 1   // 12 ~ 13
    },
    億和: {
      day_on: 8.5,
      day_off: 18,
      lunch_start: 12,
      lunch_end: 13,
      lunch_time: 1   // 12 ~ 13
    },
    匯豐: {
      day_on: 8,
      day_off: 18,
      lunch_start: 12,
      lunch_end: 13.5,
      lunch_time: 1.5 // 12 ~ 13.5
    }
  };
  var month_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  var start_time = start.time;
  var end_time = end.time;
  var total_time = 0;
  if (start.date == end.date) { // 請假是在同一天
    var theFactory = factory_obj[factory];
    total_time = end_time - start_time;
    if (start_time <= theFactory.lunch_start && end_time >= theFactory.lunch_end)
      total_time -= theFactory.lunch_time;
  } else {
    var temp = start.date.split("-");
    var s_year = temp[0];
    var s_month = temp[1];
    var s_day = temp[2];
    temp = end.date.split("-");
    var e_year = temp[0];
    var e_month = temp[1];
    var e_day = temp[2];
    if (s_month == e_month){  // 在同一月份
      var theFactory = factory_obj[factory];
      total_time = theFactory.day_off - start_time;
      if (start_time <= theFactory.lunch_start)
        total_time -= theFactory.lunch_time;
      
      total_time += end_time - theFactory.day_on;
      if (end_time >= theFactory.lunch_end)
        total_time -= theFactory.lunch_time;
      
      var work_time = theFactory.day_off - theFactory.day_on - theFactory.lunch_time;
      var int_s_day = parseInt(s_day) + 1;
      var int_e_day = parseInt(e_day);    
      while ((int_e_day - int_s_day) >= 1){  // 7-14 9:00 ~ 7-16 15:00
        var my_date = s_year + "/" + s_month + "/" + int_s_day.toString();
        if (checkSunday(check_date)) {
          int_s_day++;
          continue;
        }       
        total_time += work_time;
        int_s_day++;
      }
    }
    else{
      if (s_year % 400 == 0 || (s_year % 4 == 0 && !(s_year % 100 == 0))) // 閏年判斷
        month_day[1] = 29;
      var month_tail = month_day[s_month - 1];
      var theFactory = factory_obj[factory];
      total_time = theFactory.day_off - start_time;
      if (start_time <= theFactory.lunch_start)
        total_time -= theFactory.lunch_time;
      
      total_time += end_time - theFactory.day_on;
      if (end_time >= theFactory.lunch_end)
        total_time -= theFactory.lunch_time;
      
      var work_time = theFactory.day_off - theFactory.day_on - theFactory.lunch_time;
      var int_s_day = parseInt(s_day) + 1;
      var int_e_day = parseInt(e_day);
      while ((month_tail - int_s_day) >= 1){ // 7-14 9:00 ~ 7-15 15:00
        var check_date = s_year + "/" + s_month + "/" + int_s_day.toString();
        if (checkSunday(check_date)) {
          int_s_day++;
          continue;
        }
        total_time += work_time;
        int_s_day++;
      }
      var i = 1;
      while ((int_e_day - i) >= 1){
        total_time += work_time;
        i++;
      }
    }
  }
  return total_time;
}

function checkSunday(s_date) {
  var d = new Date(s_date);
  if (d.getDay() == 0)
    return true;
  return false;
}

function checkForm() {
  var place_val = $("#place").val();
  var name = $("#name").val();
  var start_date = $("#date-start").val();
  var end_date = $("#date-end").val();
  var reason = $("#reason").val();
  var apply_type = getRadioValue("group4");
  var apply_way = getRadioValue("group7");
  var first_error = "";
  if (apply_way == "") {
    $("#group7").addClass("invalid");
    first_error = "#group7";
  }
  if (apply_type == "") {
    $("#group4").addClass("invalid");
    first_error = "#group4";
  }
  if (reason == "") {
    $("#reason").addClass("invalid");
    first_error = "#reason";
  }
  if (end_date == "") {
    $("#date-end").addClass("invalid");
    first_error = "#date-end";
  }
  if (start_date == "") {
    $("#date-start").addClass("invalid");
    first_error = "#date-start";
  }
  if (name == "") {
    $("#name").addClass("invalid");
    first_error = "#name";
  }
  if (place_val == "") {
    $("#place").addClass("invalid");
    first_error = "#place";
  }

  if (first_error != "") {
    $("body").animate({
      scrollTop: $(first_error).offset().top - 50
    }, 1000, 'easeOutExpo');
  }

  if (place_val == "" || name == "" || start_date == "" || end_date == "" || reason == "" || apply_type == "" || apply_way == "")
    return false;
  return true;
}

