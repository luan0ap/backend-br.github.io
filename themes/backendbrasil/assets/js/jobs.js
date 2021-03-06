const generateLabels = labels => {
  labels = Array.isArray(labels) ? labels : [labels]

  labels = labels.filter(label => label.length)

  labels = labels.map(label => `<li>${label}</li>`)
  labels = labels.join('')

  if (!labels.length) {
    return ''
  }

  return `
    <ul class="jobs--flags">
      ${labels}
    </ul>
  `
}

const generateLocation = location => location && location.length ? `
  <p>
    <span class="fas fa-map"></span>
    <span>${location}</span>
  </p>
` : ''

const getLocation = title => {
  const regex = /^(?:\[)(.*?)(?:\])/g

  const result = title.match(regex)

  if (Array.isArray(result) && result.length) {
    return result.shift().replace(/\[|\]/g, '')
  }

  return ''
}

const jobTitle = title => title.slice ? title.slice(0, 60) : title;

const generateJob = ({ id, url, title, labels, location }) => `
  <article 
    class="
      jobs--listing-item 
      no-grow 
      no-shrink 
      tile 
      is-flex-one-quarter-desktop
      is-flex-one-third-mobile
      is-flex-full
    "

    data-id="${id}"
    data-labels="${labels.filter(label => label.length).join(',')}"
    data-location="${location}"
    data-title="${title.replace(/^\[(.*?)\]\s?/g, '')}"
  >
    <a href="${url}" target="_blank">
      <h4 class="is-size-5">${jobTitle(title.replace(/^\[(.*?)\]\s?/g, ''))}</h4>

      ${generateLabels(labels)}

      ${generateLocation(location)}
    </a>
  </article>
`

const jobHideClass = 'jobs--listing-hidden'
const setClass = job => {
  job = $(job)

  if (!job.hasClass(jobHideClass)) {
    job.addClass(jobHideClass)
  }
};

const filterJobs = ({ key, value }) => {
  if (value === 'clear') {
    return $(`.jobs--listing-item[data-${key}]`)
      .removeClass(jobHideClass)
  }

  $('.jobs--listing-item').forEach(job => {
    const dataset = job.dataset

    if (
      !dataset || 
      !dataset[key] || 
      !dataset[key].length ||
      typeof dataset[key] !== 'string'
    ) {
      return setClass(job)
    }

    const found = dataset[key]
      .match(new RegExp(value, 'gi'))

    if (!found || !found.length) {
      return setClass(job)
    }

    $(job).removeClass('jobs--listing-hidden')
  })
}

const getPaginators = link => {
  const result = { next: false, last: false }

  if (!link) {
    return result
  }

  const links = link.split(',')
  const linkRegex = /^\s?<(.*?)>/g
  const relRegex = /"([a-z]{4})"/g

  links.forEach(it => {
    let url = it.match(linkRegex)
    let rel = it.match(relRegex)

    if (url && url.length) {
      url = url.shift().replace(/<|>|/g, '')
    }

    if (rel && rel.length) {
      rel = rel.shift().replace(/"+/g, '')
    }

    if (rel === 'next') {
      result.next = url
    } else {
      result.last = url
    }
  })

  return result
}

const loadIssues = (url, cb) => $.getJSON(
  url,
  (data, status, xhr) => {
    window.data = xhr
    const issues = $
      .map(data, issue => ({
        url: issue.html_url,
        title: issue.title,
        location: getLocation(issue.title),
        labels: $.map(issue.labels, label => label.name),
        id: issue.id
      }))
      .filter(issue => !$(`article[data-issue-id='${issue.id}']`).length)
      .map(generateJob)
      
    if (issues.length) {
      $('#jobsListingWrapper').append(issues.join(''))
    }

    const { next, last } = getPaginators(xhr.getResponseHeader('Link'))
    const loadBtn = $('#loadMoreJobs')
    const currentNextUrl = loadBtn.attr('data-next')

    if (cb) {
      cb()
    }

    if (
      (!next && currentNextUrl.length) ||
      !issues.length ||
      next === url ||
      next === currentNextUrl
    ) {
      loadBtn.html(loadBtn.attr('data-is-empty'))
      loadBtn.attr('disabled', true)
      return
    }

    loadBtn.attr('data-next', next)
  }
)

document.addEventListener('DOMContentLoaded', () => {
  if (!$('#state').length) {
    return
  }

  const githubIssuesUrl = 'https://api.github.com/repos/backend-br/vagas/issues'
  loadIssues(githubIssuesUrl)
  const toWatch = [
    {
      htmlId: 'state',
      filterKey: ['location'],
      clearValue: 'clear'
    },
    {
      htmlId: 'language',
      filterKey: ['labels'],
      clearValue: 'clear'
    }
  ]

  const applySelectFilter = item => {
    const value = $(`#${item.htmlId}`).val()
    item
      .filterKey
      .forEach(
        key => filterJobs({ key, value })
      )
  };

  const applyTextFilter = () => {
    const value = $('#keyword').val()

    $('.jobs--listing-item').forEach(job => {
      const filterKeys = ['labels', 'location', 'title']
      const dataset = job.dataset
      const keys = filterKeys.map(k => k);

      if (!dataset) {
        return setClass(job)
      }

      let keep = false

      while (keys.length) {
        const key = keys.shift()

        if (dataset[key]) {
          keep = true
          break;
        }
      }

      if (!keep) {
        return setClass(job)
      }

      let show = false

      while (filterKeys.length) {
        const key = filterKeys.shift()
        const found = dataset[key]
          .match(new RegExp(value, 'gi'))

        if (found && found.length) {
          show = true
          break;
        }
      }

      if (!show) {
        return setClass(job)
      }

      $(job).removeClass('jobs--listing-hidden')
    })
  };

  toWatch.forEach(item => {
    $(`#${item.htmlId}`).on('change', e => applySelectFilter(item))
  })

  $('#keyword').on('input', e => applyTextFilter())

  $('#clearFilter').on('click', e => {
    $('.jobs--listing-hidden') 
      .removeClass('jobs--listing-hidden')

    toWatch
      .forEach(
        item => $(`#${item.htmlId}`).val(item.clearValue || '')
      )
  })

  $('#loadMoreJobs').on('click', e => {
    const loadBtn = $('#loadMoreJobs')
    const currentNextUrl = loadBtn.attr('data-next')
    loadIssues(currentNextUrl, () => {
      applyTextFilter()
      toWatch.forEach(applySelectFilter)
    })
  })
})
