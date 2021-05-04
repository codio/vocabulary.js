(function () {
    const fields = ['term', 'definition']
    const titles = ['Term', 'Definition']
    let tablesArr = []

    const assetsPath = 'https://static-assets.codio.com/vocabulary-widget/'

    const script = document.createElement('script')
    script.src = assetsPath + 'papaparse.min.js'
    document.head.appendChild(script)

    const update = _.debounce(_update, 150, {maxWait: 600})

    const debounced_save = _.debounce(save, 2000, {maxWait: 1000})

    window.addEventListener("codio-guides-rendered", function () {
        update()
    });

    window.setTimeout(update, 1)

    function _update() {
        let counter = 0
        const div_elements = document.querySelectorAll('div[data-codio-type="vocabulary"]')
        if (!div_elements) return

        for (const div of div_elements) {
            if (div.querySelector('table') !== null) return

            const file_path = div.getAttribute('data-codio-file')
            div.id = 'vocab-' + counter++
            div.className = 'vocab'

            window.codio.getFile(file_path, div.id, function (res) {
                const parsed_data = parseCSV(res)
                tablesArr.push({id: res.args.id, file_path: res.args.path, data: parsed_data})
                renderTable(res.args.id, parsed_data)
            })
        }
    }


    function renderTable(id, data) {
        const div = document.querySelector('#' + id)
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const thr = document.createElement('tr');

        titles.forEach((title) => {
            const th = document.createElement('th');
            th.appendChild(document.createTextNode(title));
            thr.appendChild(th);
        });

        thead.appendChild(thr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.forEach((obj) => {
            const tr = document.createElement('tr');
            fields.forEach((field) => {
                const td = document.createElement('td');

                const container = document.createElement('div');
                container.style.position = 'relative'
                container.style.margin = '10px 0px'

                const img = document.createElement('img');
                img.src = assetsPath + 'saved.svg'
                img.id = obj.id + '-img'
                img.style.height = '18px'
                img.style.display = 'none'
                img.style.position = 'absolute'
                img.style.top = '5px'
                img.style.right = '9px'
                img.style.opacity = '0.9'

                const textarea = document.createElement('textarea');
                textarea.id = obj.id
                textarea.className = 'definition'
                textarea.style.width = '99%'
                textarea.style.padding = '10px 30px 10px 10px'
                textarea.style.border = 'thin solid #dddddd'
                textarea.style.overflow = 'hidden'
                textarea.style.outline = 'none'
                textarea.style.resize = 'none'
                textarea.setAttribute('maxlength', 2000);

                if (field === 'definition') {
                    container.appendChild(textarea);
                    container.appendChild(img);
                    textarea.appendChild(document.createTextNode(obj[field]));
                    tr.appendChild(container);
                } else {
                    td.appendChild(document.createTextNode(obj[field]));
                    tr.appendChild(td);
                }
            });
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        div.appendChild(table)

        var ta_elements = div.querySelectorAll('textarea.definition');
        for (let el of ta_elements) {
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + "px"
            bindEvents(el)
        }
    }

    function bindEvents(el) {
        el.addEventListener("blur", function (e) {
            save(this)
        })

        el.addEventListener("keydown", function (e) {
            var self = this;
            setTimeout(function () {
                self.style.height = 'auto'
                self.style.height = el.scrollHeight + "px"
            }, 0);

            debounced_save(this)
        })

        el.addEventListener("keyup", function (e) {
            document.querySelector('#' + this.id + '-img').style.display = 'none'
        })
    }

    function save(el) {
        const content = el.value
        const parent_div = el.closest('div.vocab')
        const object = tablesArr.filter(i => i.id === parent_div.id)[0]
        const item = object['data'].filter(i => i.id === el.id)[0]

        if (item.definition !== el.value) {
            item.definition = content
            saveToFile(object, el.id)
        }
    }


    function saveToFile(object, item_id) {
        const data = []
        const objectArr = object.data
        const file_path = object.file_path

        const arr = objectArr.map(function (obj) {
            return {term: obj.term, definition: obj.definition, ek: obj.ek}
        });

        arr.forEach((obj) => {
            data.push(Object.values(obj))
        })

        const content = Papa.unparse(data)

        window.codio.saveFile(file_path, content, item_id, function (res) {
            document.querySelector('#' + res.args.item_id + '-img').style.display = 'block'
        })
    }

    function parseCSV(data) {
        objectArr = []
        let counter = 0
        const parsed = Papa.parse(data.content)

        parsed['data'].forEach((item) => {
            objectArr.push({id: data.args.id + '-item-' + counter++, term: item[0] || '', definition: item[1] || '', ek: item[2] || ''})
        })
        return objectArr
    }
}())
