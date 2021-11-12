document.addEventListener("DOMContentLoaded", function() {
    let request = 'https://front-test.beta.aviasales.ru/search';
    getResponse()
    async function getResponse() {

        try {
            let currentID = await fetch(request);
            let responseId = await currentID.json();
            let ticketsPacks = await fetch(`https://front-test.beta.aviasales.ru/tickets?searchId=${responseId.searchId}`); //3sdoo - даёт 500                ${responseId.searchId}
            let ticketsPacksArr = await ticketsPacks.json();
            tickets = JSON.parse(JSON.stringify(ticketsPacksArr.tickets));
        } catch (error) {
            catchError();
        };
        creationCards(tickets);
        getStopsContainers(tickets);

        initButtons();


    };

    function creationCards(tickets) {
        document.querySelector('.resolver__container').innerHTML = '';

        // let list = document.querySelector('.resolver__container');

        for (let index = 0; index < 5; index++) {

            //  Время вылета в формате ISO "yyyy-mm-ddThh:mm:ss.mscZ"
            let departureTimeUTC = new Date(tickets[index].segments[0].date); //Weak Month DD YYYY 00:00:00 GMT+0500 (Екатеринбург, стандартное время)
            //  Время обратного вылета в формате ISO
            let flyingBackTimeUTC = new Date(tickets[index].segments[1].date);

            //  Получаем время прилёта туда
            let destinationTime = getDestinationTime(departureTimeUTC, tickets[index].segments[0].duration);
            //  Получаем время прилёта туда
            let flyingBackDestinationTime = getDestinationTime(departureTimeUTC, tickets[index].segments[1].duration);

            //  Получаем время вылета в формате hh:mm, игнорируя надбавку часового пояса (+5 Екатеринбург).
            let formatedDepartureTime = formattedDate(departureTimeUTC);
            //  Получаем время обратного вылета в формате hh:mm, игнорируя надбавку часового пояса (+5 Екатеринбург).
            let formatedflyingBackTimeUTC = formattedDate(flyingBackTimeUTC);

            // Корректируем приписку пересадок, в зависимости от количества
            let transferAmountDeparture = getCorrectTransfer(tickets[index].segments[0].stops.length);
            let transferAmountFlyingBack = getCorrectTransfer(tickets[index].segments[1].stops.length);

            let stopsDeparture = getSpaces(tickets[index].segments[0].stops);
            let stopsFlyingBack = getSpaces(tickets[index].segments[1].stops);

            // console.log("tickets[index].segments[0].duration: ", tickets[index].segments[0].duration);
            // Общее время полёта туда (В пути)
            let originDurationTime = correctingDurationTime(tickets[index].segments[0].duration);
            // Общее время полёта обратно (В пути)
            let destinationDurationTime = correctingDurationTime(tickets[index].segments[1].duration);




            let list = document.querySelector('.resolver__container');
            list.innerHTML += `
            <div class="tickets__container ticket _shadow">
                <div class="ticket__header">
                    <span class="ticket__value">${Intl.NumberFormat().format(tickets[index].price)}<span class="ticket__current-value">&nbsp;Р</span></span>

                    <img src="http://pics.avs.io/99/36/${tickets[index].carrier}.png" alt="alt.png">
                </div>
                <div class="ticket__row">
                    <div class="ticket__collumn">
                        <div class="ticket__collumn_top">${tickets[index].segments[0].origin} - ${tickets[index].segments[0].destination}</div>
                        <div class="ticket__collumn_bottom">${formatedDepartureTime} – ${destinationTime}</div>
                    </div>
                    <div class="ticket__collumn">
                        <div class="ticket__collumn_top">В пути</div>
                        <div class="ticket__collumn_bottom">${ originDurationTime }</div>
                    </div>
                    <div class="ticket__collumn">
                        <div class="ticket__collumn_top">${transferAmountDeparture}</div>
                        <div class="ticket__collumn_bottom">${stopsDeparture}</div>
                    </div>
                </div>
                <div class="ticket__row">
                    <div class="ticket__collumn">
                        <div class="ticket__collumn_top">${tickets[index].segments[1].origin} - ${tickets[index].segments[1].destination}</div>
                        <div class="ticket__collumn_bottom">${formatedflyingBackTimeUTC} – ${flyingBackDestinationTime}</div>
                    </div>
                    <div class="ticket__collumn">
                        <div class="ticket__collumn_top">В пути</div>
                        <div class="ticket__collumn_bottom">${ destinationDurationTime }</div>
                    </div>
                    <div class="ticket__collumn">
                        <div class="ticket__collumn_top">${transferAmountFlyingBack}</div>
                        <div class="ticket__collumn_bottom">${stopsFlyingBack}</div>
                    </div>
                </div>
            </div>
            `

        };

        // list.innerHTML += `
        //     <button class="show-more header-text">Показать еще 5 билетов!</button>
        // `
    };

    function getDestinationTime(origin, duration) {

        let totaOriginHours = 60 * origin.getUTCHours() + origin.getMinutes();
        let totalDuration = (totaOriginHours + duration);
        let hours = (totalDuration / 60 ^ 0) % 24; // ^ 0 - убираем цифры после запятой (снижаем разрядность до нуля).

        // Приводим к кратности 5 || 10
        let minutes = roundToNearest(totalDuration % 60);

        if (hours < 10) hours = '0' + hours;
        if (minutes < 10) minutes = '0' + minutes;
        totalDuration = hours + ':' + minutes;

        return totalDuration;
    };

    function formattedDate(d) {
        let tempMinutes = roundToNearest(d.getMinutes());

        return [d.getUTCHours(), tempMinutes]
            .map(n => n < 10 ? `0${n}` : `${n}`).join(':');
    };

    function correctingDurationTime(totalDuration) {

        // получаем количество часов.
        let durationHours = totalDuration / 60 ^ 0; // ^ 0 - убираем цифры после запятой (снижаем разрядность до нуля).
        // приписываем к часам часы, к минутам минуты.
        if (durationHours) {
            let durationMinutes = roundToNearest(totalDuration % 60);

            if (durationMinutes < 10) durationMinutes = '0' + durationMinutes;
            totalDuration = durationHours + 'ч ' + durationMinutes + 'м';
        } else {
            totalDuration = totalDuration + 'м';
        }

        return totalDuration;
    };

    function roundToNearest(number) {
        return (number % 10 > 5) ? (number % 10 === 0 ? number : Math.ceil(number / 10) * 10) : Math.floor(number / 5) * 5;
    };

    function getCorrectTransfer(transferAmount) {
        return (transferAmount === 0) ? transferAmount = "Без пересадок" : ((transferAmount === 1) ? transferAmount + " пересадка" : transferAmount + " пересадки");
    };

    function getSpaces(str) {
        return (str.length > 1) ? str.join(', ') : str.join('');
    };

    function catchError() {
        let err = document.querySelector('.resolver').innerHTML = '';
        err = document.querySelector('.resolver');
        err.innerHTML += `
            <div class="tickets__container ticket _shadow">
                <div class="error-message">
                    <div class="error-message__text header-text">
                        Загрузка данных оказалась не удачна.<br>Пожалуйста, попробуйте ещё раз.
                    </div>
                    <a href="" class="error-message__btn show-more">Перезагрузить страницу</a>
                </div>
            </div>
            `
    };

    function initButtons() {
        const buttons = document.querySelector('.tabs');

        // console.log("buttons.children:", buttons.children[0].className);
        buttons.onclick = function(e) {
            for (let i = 0; i < buttons.children.length; i++) {
                buttons.children[i].classList.remove('_active');
            }
            e.target.classList.add('_active');
        }

    }

    function sortByPrice(arr) {
        const temp = JSON.parse(JSON.stringify(arr));
        temp.sort((a, b) => a.price - b.price);

        // console.log(temp);
        creationCards(temp);
    }

    function sortByDestinationTime(arr) {

        const temp = JSON.parse(JSON.stringify(arr));
        temp.sort((a, b) => a.segments[0].duration - b.segments[0].duration);

        // console.log(temp);
        creationCards(temp);
    }

    function getStopsContainers(tickets) {
        tickets.forEach(() => {
            noStops = tickets.filter(e => e.segments[0].stops.length == 0 && e.segments[1].stops.length == 0);
            oneStops = tickets.filter(e => e.segments[0].stops.length == 1 && e.segments[1].stops.length == 1);
            twoStops = tickets.filter(e => e.segments[0].stops.length == 2 && e.segments[1].stops.length == 2);
            threeStops = tickets.filter(e => e.segments[0].stops.length == 3 && e.segments[1].stops.length == 3);

        });


    };
    //     const a = [3, 1, 3, -5, -3, -4, 5, -2, 67, 2, 9, 6, 7, 0];

    // let b = a.filter((item, index, array) => {
    //     // console.log(index);
    //     return index;
    // });

    // Проверка чекбокса при клике мыши.
    document.querySelector('.filter-body').addEventListener('click', () => {

        if (document.querySelector('._departure-all').checked) {
            document.querySelector('._departure-all').checked = false;
        } else {
            document.querySelector('._departure-all').checked = true;
        }

    });

    document.querySelector('._cheaper').addEventListener('click', () => {
        sortByPrice(tickets);
    });
    document.querySelector('._faster').addEventListener('click', () => {
        sortByDestinationTime(tickets);
    });

});

// Разбить массив ticket на количество пересадок, дополнять/удалять, при фильтрации