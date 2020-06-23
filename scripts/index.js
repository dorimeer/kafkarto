const backURL = "http://127.0.0.1:1888"

// DOM элементы
const checkboxesContainer = document.querySelector(".checks");
const checkboxesContainer2 = document.querySelector(".checks2");// контейнер всех чекбоксов
const textbox = document.querySelector(".textBox"); // контейнер строки поиска

function createItem(type, e, appendTo) {
    var id = type +"_"+ e.id;
    var div = document.createElement("DIV");
    div.className = "checkbox";
    div.innerHTML = "<input type=\"checkbox\" class=\"custom-checkbox\" id=\""+ id +"\" name=\""+ id +"\" value=\""+ e.name +"\" /> <label for=\""+ id +"\">"+ e.name +"</label>";
    appendTo.appendChild(div)
}

function getItemsFrom(enterPoint, cb, dataToSend) {
    var req = new XMLHttpRequest();
    req.open("POST", enterPoint, true);
    req.onreadystatechange = function() {
        if (this.readyState != 4) return;
        var data = JSON.parse(this.responseText).data;
        if (! data) throw("No data in " + this.responseText);
        cb(data);
    };
    req.send(dataToSend);
}

function getItems() {
    getItemsFrom(backURL + "/api/v1.0/coffee", function(data) {
        for (item in data) {
            createItem("coffee", data[item], checkboxesContainer);
        }
        checkboxesContainer.querySelectorAll(".custom-checkbox").forEach(addListeners);
    });

    getItemsFrom(backURL + "/api/v1.0/adds", function(data) {
        for (item in data) {
            createItem("adds", data[item], checkboxesContainer2);
        }
        checkboxesContainer2.querySelectorAll(".custom-checkbox").forEach(addListeners);
    });
}

function searchClick() {
    var req_data = {};
    if (geo) {
        req_data.geo = {}
        req_data.geo.latitude = geo.latitude;
        req_data.geo.longitude = geo.longitude;
    }
    textbox.querySelectorAll(".container").forEach(function(item, index) {
        var id = item.getAttribute("id");
        var splitted_id = id.split("_");
        if (splitted_id[0] == "coffee") {
            if (! req_data.coffee) req_data.coffee = [];
            req_data.coffee.push(splitted_id[1]);
        }
        if (splitted_id[0] == "adds") {
            if (! req_data.additions) req_data.additions = [];
            req_data.additions.push(splitted_id[1]);
        }
    });
    if (req_data.geo) {
        req_data.radius = document.querySelector(".distance").value;
    }
    
    console.log("click", req_data);
    
    getItemsFrom(backURL + "/api/v1.0/find", function(data) {
        console.log(data);
        var appendTo = document.querySelector(".resultsBox");
        appendTo.innerHTML = "";
        for (i in data) {
            var item = data[i];
            var div = document.createElement("DIV");
            div.className = "results";
            div.innerHTML = "<table><tr><td>" + item.name + "</td></tr><tr><td><a href=\"" + item.url + "\">" + item.address + "</a></td></tr></table>";
            appendTo.appendChild(div);
        }
    }, JSON.stringify(req_data));
}

// функция для самоуничтожения одной пилюльки
function selfRemove(e, type) {
  e.target.parentNode.removeChild(e.target);
  type.querySelector(
    `[value='${e.target.getAttribute("value")}']`
  ).checked = false; //  берём контейнер чекбоксов, находим в нём чекбокс с тем же value что нам нужен и выключаем его
}

// добавляет елемент в строку поиска

function addElementToTextBox(target) {
  const container = document.createElement("div"); //создаем контейнер див
  container.id = target.id;
  container.className = "container"; //даём контейнеру класс
  container.setAttribute("value", target.value); //даём контейнеру атрибут value
  container.innerHTML = target.value; //даём контейнеру текст
  textbox.appendChild(container); // присоединяем контейнер в елемент поиска
  const type = target.parentNode;
  container.addEventListener("click", (e) => {
    selfRemove(e, type);
  }); //навешиваем обработчик самоуничтожения по клику
}

//  убирает елемент из строки поиска

function removeElementFromTextBox(target) {
  const found = textbox.querySelector(`[value='${target}']`); //берем елемент из строки поиска с тем же значением value, что пришло в функцию
  found.parentNode.removeChild(found); // в дом дереве выходим из елемента на уровень выше и у родительского елемента удаляем дочерний(удаление самого себя)
}

//  навешиваем обработчик на изменение чекбокса на каждый чекбокс из списка
function addListeners(check) {
  check.addEventListener("change", (e) => {
    if (e.target.checked) {
      //  если чекбокс включился вызываем эдд
      addElementToTextBox(e.target);
    } else {
      // если чекбокс выключился вызываем ремув
      removeElementFromTextBox(e.target);
    }
  });
}

