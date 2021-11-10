document.addEventListener("DOMContentLoaded", function() {
    let request = 'https://front-test.beta.aviasales.ru/search';
    let tikets = JSON.parse(JSON.stringify(getResponse()));
    console.log("JSON.parse(JSON.stringify(getResponse()))", tikets);
    async function getResponse() {

        try {
            let currentID = await fetch(request);
            let responseId = await currentID.json();
            let tiketsPacks = await fetch(`https://front-test.beta.aviasales.ru/tickets?searchId=${responseId.searchId}`); //3sdoo - даёт 500                ${responseId.searchId}
            let tiketsPacksArr = await tiketsPacks.json();
            console.log(tiketsPacksArr.tickets);
            tikets = JSON.parse(JSON.stringify(tiketsPacksArr.tickets));
        } catch (error) {
            catchError();
        };

        creationCards(tikets);
        initButtons();
    };


    function creationCards(tikets) {

        document.querySelector('.resolver__container').innerHTML = '';

        let list = document.querySelector('.resolver__container');
        list.innerHTML += `
            <div class="resolver__tabs tabs" id="tabs">
                <button class="tabs__button header-text _cheaper" data-for-tab="1">Самый дешевый</button>
                <button class="tabs__button header-text _faster" data-for-tab="2">Самый быстрый</button>
            </div>
        `

        for (let index = 0; index < 5; index++) {

            //  Время вылета в формате ISO "yyyy-mm-ddThh:mm:ss.mscZ"
            let departureTimeUTC = new Date(tikets[index].segments[0].date); //Weak Month DD YYYY 00:00:00 GMT+0500 (Екатеринбург, стандартное время)
            //  Время обратного вылета в формате ISO
            let flyingBackTimeUTC = new Date(tikets[index].segments[1].date);

            //  Получаем время прилёта туда
            let destinationTime = getDestinationTime(departureTimeUTC, tikets[index].segments[0].duration);
            //  Получаем время прилёта туда
            let flyingBackDestinationTime = getDestinationTime(departureTimeUTC, tikets[index].segments[1].duration);

            //  Получаем время вылета в формате hh:mm, игнорируя надбавку часового пояса (+5 Екатеринбург).
            let formatedDepartureTime = formattedDate(departureTimeUTC);
            //  Получаем время обратного вылета в формате hh:mm, игнорируя надбавку часового пояса (+5 Екатеринбург).
            let formatedflyingBackTimeUTC = formattedDate(flyingBackTimeUTC);

            // Корректируем приписку пересадок, в зависимости от количества
            let transferAmountDeparture = getCorrectTransfer(tikets[index].segments[0].stops.length);
            let transferAmountFlyingBack = getCorrectTransfer(tikets[index].segments[1].stops.length);

            let stopsDeparture = getSpaces(tikets[index].segments[0].stops);
            let stopsFlyingBack = getSpaces(tikets[index].segments[1].stops);

            // console.log("tikets[index].segments[0].duration: ", tikets[index].segments[0].duration);
            // Общее время полёта туда (В пути)
            let originDurationTime = correctingDurationTime(tikets[index].segments[0].duration);
            // Общее время полёта обратно (В пути)
            let destinationDurationTime = correctingDurationTime(tikets[index].segments[1].duration);




            let list = document.querySelector('.resolver__container');
            list.innerHTML += `
            <div class="tikets__container tiket _shadow">
                <div class="tiket__header">
                    <span class="tiket__value">${Intl.NumberFormat().format(tikets[index].price)}<span class="tiket__current-value">&nbsp;Р</span></span>

                    <img src="http://pics.avs.io/99/36/${tikets[index].carrier}.png" alt="alt.png">
                </div>
                <div class="tiket__row">
                    <div class="tiket__collumn">
                        <div class="tiket__collumn_top">${tikets[index].segments[0].origin} - ${tikets[index].segments[0].destination}</div>
                        <div class="tiket__collumn_bottom">${formatedDepartureTime} – ${destinationTime}</div>
                    </div>
                    <div class="tiket__collumn">
                        <div class="tiket__collumn_top">В пути</div>
                        <div class="tiket__collumn_bottom">${ originDurationTime }</div>
                    </div>
                    <div class="tiket__collumn">
                        <div class="tiket__collumn_top">${transferAmountDeparture}</div>
                        <div class="tiket__collumn_bottom">${stopsDeparture}</div>
                    </div>
                </div>
                <div class="tiket__row">
                    <div class="tiket__collumn">
                        <div class="tiket__collumn_top">${tikets[index].segments[1].origin} - ${tikets[index].segments[1].destination}</div>
                        <div class="tiket__collumn_bottom">${formatedflyingBackTimeUTC} – ${flyingBackDestinationTime}</div>
                    </div>
                    <div class="tiket__collumn">
                        <div class="tiket__collumn_top">В пути</div>
                        <div class="tiket__collumn_bottom">${ destinationDurationTime }</div>
                    </div>
                    <div class="tiket__collumn">
                        <div class="tiket__collumn_top">${transferAmountFlyingBack}</div>
                        <div class="tiket__collumn_bottom">${stopsFlyingBack}</div>
                    </div>
                </div>
            </div>
            `

        };

        list.innerHTML += `
            <button class="show-more header-text">Показать еще 5 билетов!</button>
        `
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
            <div class="tikets__container tiket _shadow">
                <div class="error-message">
                    <div class="error-message__text header-text">
                        Загрузка данных оказалась не удачна.<br>Пожалуйста, попробуйте ещё раз.
                    </div>
                    <a href="" class="error-message__btn show-more">Перезагрузить страницу</a>
                </div>
            </div>
            `
    };

    // function filter(array) {
    //     // arr.filter принимает 3 аргумента Vale, Index, currArray
    //     let c = a.filter(function(currentValue, index) {
    //         return index % 2 == 0;
    //     });
    // }

    function initButtons() {
        const buttons = document.querySelector('.tabs');
        buttons.onclick = function(e) {
            for (let i = 0; i < buttons.children.length; i++) {
                buttons.children[i].classList.remove('_active');
            }
            e.target.classList.add('_active');
        }
    }

    // function sortByPrice(arr) {
    //     const temp = JSON.parse(JSON.stringify(arr));
    //     console.log(temp);
    //     temp.forEach(item => {
    //         if (typeof(item.price) === 'string') {
    //             item.price = +item.price.replace(/\D/g, ''); //Заменяем не цифры на пустоты.
    //         } else {
    //             item.price = +item.price.newUan.replace(/\D/g, '');
    //         }
    //     });
    //     temp.sort((a, b) => a.price > b.price ? 1 : -1);
    //     document.querySelector('.result').innerHTML = '';

    //     temp.forEach(item => {
    //         document.querySelector('.result').innerHTML += `
    //       <h3>${item.name}</h3>
    //       <div>Отзывов: ${item.ratingRevievs}</div>
    //       <div>Цена: ${item.price} грн</div>
    //     `
    //     })
    // }
    // document.querySelector('._cheaper').addEventListener('click', () => {
    //     sortByPrice(tikets);
    // });
    // document.querySelector('._faster').addEventListener('click', () => {
    //     sortByFeedback(items);
    // });

});