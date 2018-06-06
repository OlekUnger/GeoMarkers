var Addresses = JSON.parse(localStorage.getItem('Addresses'));

if (!Addresses) {
    Addresses = [];
}

var popUp = document.querySelector('.pop-up'),
    addressTitle = document.querySelector('.address'),
    closeBtn = document.querySelector('.close'),
    commentsBlock = document.querySelector('.comments'),
    form = document.querySelector('#form');

closeBtn.addEventListener('click', () => {
    popUp.style.display = 'none';
    form.reset();
    for (let item of form.elements) {
        item.style.border = '1px solid #c4c4c4';
    }
});

ymaps.ready(init);

function init() {
    var myMap = new ymaps.Map('map', {
            center: [59.91, 30.40],
            zoom: 12
        }, {
            searchControlProvider: 'yandex#search'
        }),
        objectManager = new ymaps.ObjectManager({
            clusterize: true,
            gridSize: 35,
            clusterDisableClickZoom: true,
            groupByCoordinates: true,
            clusterBalloonContentLayout: "cluster#balloonCarousel",
            preset: 'islands#darkOrangeClusterIcons',
            clusterBalloonContentLayoutWidth: 300,
            clusterBalloonContentLayoutHeight: 150,
        });

    objectManager.objects.options.set('preset', 'islands#nightDotIcon');
    objectManager.options.set('geoObjectOpenBalloonOnClick', false);
    myMap.geoObjects.add(objectManager);

    objectManager.objects.events.add('click', (e) => {
        let objectId = e.get('objectId'),
            address = Addresses[objectId].addr;

        getComments(address);
        addressTitle.textContent = address;
        form.coords.value = Addresses[objectId].coords;
        form.address.value = address;
        popUp.style.display = 'block';
    });

    objectManager.clusters.events.add('balloonopen', (e) => {
        let data = objectManager.clusters.balloon.getData();
        let clusterCoordinates = data.geometry.coordinates;

        document.addEventListener('click', (e) => {
            let address;
            if (e.target.className == 'address_link') {
                address = e.target.innerText;

                getComments(address);
                addressTitle.textContent = address;
                form.address.value = address;
                form.coords.value = clusterCoordinates;
                objectManager.clusters.balloon.close();
                popUp.style.display = 'block';
            }
        });
    });

    function getComments(address) {

        let comments = Addresses.filter(item => {
            return item.addr == address;
        });

        commentsBlock.innerHTML = '';
        let fragment = document.createDocumentFragment();

        for (let item of comments) {
            let comment = document.createElement('DIV');
            comment.classList.add('comment');

            let html = `<div class="comment_header">
                            <div>
                                <span class="c_name"><b>${item.name} </b></span>
                                <span class="c_place"> ${item.place}</span>
                            </div>
                            <span class="c_date"> ${item.date} </span>
                       </div>
                        <div class="comment_content">
                            <p id="c_text">${item.feelings}</p>
                        </div>`;
            comment.innerHTML = html;
            fragment.appendChild(comment);
        }
        commentsBlock.appendChild(fragment);
        return comments;
    }

    myMap.events.add('click', function (e) {
        form.reset();

        let coords = e.get('coords');
        ymaps.geocode(coords)
            .then((res) => {
                let object = res.geoObjects.get(0),
                    addr = object.properties.get('text');

                for (let item of Addresses) {
                    if (item.addr == addr) {
                        coords = item.coords;
                    }
                }

                popUp.style.display = 'block';
                addressTitle.textContent = addr;
                form.address.value = addr;
                form.coords.value = coords;

                let comments = getComments(addr);
                if (comments.length == 0) {
                    commentsBlock.innerHTML = 'Отзывов пока нет...';
                }
            });
    });

    function setComment() {
        let comment = {},
            date = new Date();

        date = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

        comment.addr = form.address.value;
        comment.coords = form.coords.value.split(',').map(item => parseFloat(item));
        comment.name = form.name.value;
        comment.place = form.place.value;
        comment.feelings = form.feelings.value;
        comment.date = date;

        Addresses.push(comment);
        localStorage.setItem('Addresses', JSON.stringify(Addresses));
        form.reset();
        popUp.style.display = 'none';

    }

    function validateForm() {
        let validate = true;

        for (let item of form.elements) {
            if (item.value == '') {
                item.style.border = '1px solid red';
                validate = false;
            } else {
                item.style.border = '1px solid #c4c4c4';
            }
        }
        return validate;
    }

    btnSave.addEventListener('click', () => {
        let validate = validateForm();

        if (validate) {
            setComment();
            setMap();
        } else {
            return;
        }
    });

    function setMap() {
        let len = Addresses.length;

        for (let i = 0; i < len; i++) {
            objectManager.objects.add({
                type: 'Feature',
                id: i,
                geometry: {
                    type: 'Point',
                    coordinates: Addresses[i].coords
                },
                properties: {
                    balloonContentHeader: '<b>' + Addresses[i].place + '</b>',
                    balloonContentBody: `<a href="#" class="address_link">${Addresses[i].addr}</a><br/>
                    <p><b>${Addresses[i].feelings}</b></p>`,
                    balloonContentFooter: `<div style="float: right">${Addresses[i].date}</div>`
                }
            });
        }
    }

    setMap();
}