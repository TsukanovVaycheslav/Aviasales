const formSearch = document.querySelector('.form-search'),
	inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
	dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
	inputCitiesTo = formSearch.querySelector('.input__cities-to'),
	dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
	inputDateDepart = formSearch.querySelector('.input__date-depart'),
	cheapestTicket = document.getElementById('cheapest-ticket'),
	otherCheapTickets = document.getElementById('other-cheap-tickets'),
	body = document.querySelector('body');
// db/cities.json' - локальная БД городов

//онлайн база городов, прокси, ключ АПИ и БД по календарю цен
const CITY_API = 'http://api.travelpayouts.com/data/ru/cities.json',
	PROXY = 'https://cors-anywhere.herokuapp.com/',
	API_KEY = '5d2e3c92f5cbb5b20d19b432ed48fb95',
	// Получение минимальных цен на перелёт для указанных даты вылета и городов вылета и назначения
	CALENDAR = 'http://min-prices.aviasales.ru/calendar_preload',
	MAX_COUNT = 5  // количество карточек самых дешевых билетов


let city = [];

// функции
const getData = (url, callback, reject = console.error) => {
	try {

		const request = new XMLHttpRequest();						// создаем объект для отправки Http запросов

		request.open('GET', url);									// конфигурируем запрос

		request.addEventListener('readystatechange', () => {		// событие отлавливает изменение в состояние объекта запроса
			if (request.readyState !== 4) return;					// если статус подключения равен 4 выходим из функции

			if (request.status === 200) {							// если статус подключения равен 200 
				callback(request.response);							// возвращаем данные
			} else {												// иначе
				reject(request.status);								// в консоль выводим ошибку со статусом подключения
			}
		});

		request.send();												// отправляем запрос
	} catch (e) {
		console.log(e);
	}
}

const showCity = (input, list) => {									// создаём функцию
	list.textContent = '';											// обнуляем переменную которая хранит в текст выподающего меню

	if (input.value !== '') {										// если инпут пустой

		cheapestTicket.style.display = 'none'
		otherCheapTickets.style.display = 'none'

		const filterCity = city.filter((item) => {					// перебираем массив и ищем совпадения
			const fixItem = item.name.toLowerCase();				// присваеваем переменной совпадение 
			return fixItem.startsWith(input.value.toLowerCase());	// возвращаем значение в инпут
			// return fixItem.includes(input.value.toLowerCase());
		});

		// другой способ сортировки ( без использования startsWith() )
		// const filterCityFirstLetters = filterCity.filter((item) => {
		// 	return item.name.slice(0, input.value.length) === input.value
		// })
		// console.log('filterCityFirstLetters: ', filterCityFirstLetters);

		if (filterCity.length === 0) {
			const li = document.createElement('li');
			li.classList.add('dropdown__city', 'error');
			li.textContent = 'Такого города нет'
			list.append(li);
		} else {
			filterCity.forEach((item) => {
				const li = document.createElement('li');
				li.classList.add('dropdown__city');
				li.textContent = item.name;
				list.append(li);
			})
		};
		return;
	}
};

// функция для клика по городу, чтобы при клике заполнялся текстбокс
const selectCity = (event, input, list) => {
	const target = event.target;
	if (target.tagName.toLowerCase() === 'li') {			// проверяем, нажали ли мы на лишку
		input.value = target.textContent;					// присваиваем тексту инпута значение лишки
		list.textContent = '';								// обнуляем значения выпадающего меню
	}
}

const getNameCity = (code) => {								// получить название города по коду
	const objCity = city.find(item => item.code === code)
	return objCity.name
}


const getDate = (date) => {									//изменение строки даты в другой формат
	return new Date(date).toLocaleDateString('ru-Ru', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		timeZoneName: 'short'
	})

}

const getChanges = (num) => {								// получаем кол-во пересадок в виде числа и возвращаем строку
	if (num) {
		return num === 1 ? 'С одной пересадкой' : 'С двумя пересадками'
	} else {
		return 'Без пересадок'
	}
}

const getLinkAviasales = (data) => {						// формируем ссылку
	let link = 'https://www.aviasales.ru/search/'
	link += data.origin

	const date = new Date(data.depart_date)
	const day = date.getDate()
	link += day < 10 ? '0' + day : day
	const month = date.getMonth() + 1
	link += month < 10 ? '0' + month : month

	link += data.destination
	link += '1'   // один взрослый билет

	return link
}

const createCard = (data) => {
	const ticket = document.createElement('article')
	ticket.classList.add('ticket')
	let deep = ''
	if (data) {
		deep = `
			<h3 class="agent">${data.gate}</h3>
			<div class="ticket__wrapper">
				<div class="left-side">
					<a href="${getLinkAviasales(data)}" target="_blank" class="button button__buy">Купить
						за ${data.value}₽</a>
				</div>
				<div class="right-side">
					<div class="block-left">
						<div class="city__from">Вылет из города
							<span class="city__name">${getNameCity(data.origin)}</span>
						</div>
						<div class="date">${getDate(data.depart_date)}</div>
					</div>

					<div class="block-right">
						<div class="changes">${getChanges(data.number_of_changes)}</div>
						<div class="city__to">Город назначения:
							<span class="city__name">${getNameCity(data.destination)}</span>
						</div>
					</div>
				</div>
			</div>`
	} else {
		deep = '<h3>К сожалением на указанную вами дату билетов нет</h3>'
	}
	ticket.insertAdjacentHTML('afterbegin', deep)
	return ticket
}

const renderCheapDay = (cheapTicket) => {											// выводим в консоль билет на заданную дату
	cheapestTicket.style.display = 'block'
	cheapestTicket.innerHTML = '<h2>Самый дешевый билет на выбранную дату</h2>'
	const ticket = createCard(cheapTicket[0])
	cheapestTicket.insertAdjacentElement('beforeend', ticket)
}

const renderCheapYear = (cheapTickets) => {											// выводим все билеты предложенные нам
	otherCheapTickets.style.display = 'block'
	otherCheapTickets.innerHTML = '<h2>Самые дешевые билеты на другие даты</h2>'
	cheapTickets.sort((a, b) => a.value - b.value)

	for (let i = 0; i < cheapTickets.length && i < MAX_COUNT; i++) {
		const ticket = createCard(cheapTickets[i])
		otherCheapTickets.append(ticket)
	}
}

const renderCheap = (data, date) => {								// передаем в функцию данные после запроса
	const cheapTicketYear = JSON.parse(data).best_prices			// парсим данные
	const cheapTicketDay = cheapTicketYear.filter((item) => { 		// ищем билет на заданную дату
		return item.depart_date === date 
	})

	renderCheapDay(cheapTicketDay)
	renderCheapYear(cheapTicketYear)
}

// --- обработчики событий
inputCitiesFrom.addEventListener('input', () => {					// событие при наборе символов в инпуте 'откуда'
	showCity(inputCitiesFrom, dropdownCitiesFrom)					// вызов функции
});

inputCitiesTo.addEventListener('input', () => {						// событие при наборе символов в инпуте 'куда'
	showCity(inputCitiesTo, dropdownCitiesTo)						// вызов функции
});

dropdownCitiesFrom.addEventListener('click', () => {				// событие при клике на выпадающем списке 'откуда'
	selectCity(event, inputCitiesFrom, dropdownCitiesFrom);
});

dropdownCitiesTo.addEventListener('click', () => {					// событие при клике на выпадающем списке 'куда'
	selectCity(event, inputCitiesTo, dropdownCitiesTo);
});

body.addEventListener('click', () => {
	dropdownCitiesFrom.innerHTML = '';
	dropdownCitiesTo.innerHTML = '';
});

formSearch.addEventListener('submit', (event) => {					// обработчик событий при нажатии на кнопку отправки формы
	event.preventDefault()											// не обновлять страницу

	const cityFromCode = city.find((item) => inputCitiesFrom.value === item.name).code	// ищем совпадения мнпута с массивом
	const cityToCode = city.find((item) => inputCitiesTo.value === item.name).code		// ищем совпадения мнпута с массивом

	const formData = {												// создаем обьект с
		from: cityFromCode,											// код города 'откуда' 
		to: cityToCode,												// код города 'куда'
		when: inputDateDepart.value									// дата
	}

	const requestData = CALENDAR +									// формируем гет запрос
		`?depart_date=${formData.when}&origin=${formData.from}&destination=${formData.to}&one_way=true&token=${API_KEY}`;

	getData(requestData, response => {						
		renderCheap(response, formData.when)
	}, (error) => {
		cheapestTicket.style.display = 'block'
		cheapestTicket.innerHTML = '<h2 class ="error">В этом направлении нет рейсов</h2>'
		console.error('Ошибка ', error)
	})
})


// --- вызовы функций
getData(PROXY + CITY_API, (data) => {
	// выбираем только те объекты у которых не пустое поле name
	city = JSON.parse(data).filter(item => item.name);

	city.sort((a, b) => {
		if (a.name < b.name) {
			return -1;
		}
		if (a.name > b.name) {
			return 1;
		}
		return 0;
	})

});
