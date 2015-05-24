'use strict';

function getData() {
  return calcTotal(this.env.treatments,this.env.profile,this.env.time);
}

function calcTotal(treatments, profile, time) {

  var iob = 0
    , activity = 0;

  if (!treatments) return {};

  if (profile === undefined) {
    //if there is no profile default to 3 hour dia
    profile = {dia: 3, sens: 0};
  }

  if (time === undefined) {
    time = new Date();
  }

  treatments.forEach(function (treatment) {
    if (new Date(treatment.created_at) < time) {
      var tIOB = calcTreatment(treatment, profile, time);
      if (tIOB && tIOB.iobContrib) iob += tIOB.iobContrib;
      if (tIOB && tIOB.activityContrib) activity += tIOB.activityContrib;
    }
  });

  return {
    iob: iob,
    display: iob.toFixed(2) == '-0.00' ? '0.00' : iob.toFixed(2),
    activity: activity
  };
}

function calcTreatment(treatment, profile, time) {

  var dia = profile.dia
    , scaleFactor = 3.0 / dia
    , peak = 75
    , sens = profile.sens
    , iobContrib = 0
    , activityContrib = 0;

  if (treatment.insulin) {
    var bolusTime = new Date(treatment.created_at);
    var minAgo = scaleFactor * (time - bolusTime) / 1000 / 60;

    if (minAgo < peak) {
      var x1 = minAgo / 5 + 1;
      iobContrib = treatment.insulin * (1 - 0.001852 * x1 * x1 + 0.001852 * x1);
      activityContrib = sens * treatment.insulin * (2 / dia / 60 / peak) * minAgo;

    } else if (minAgo < 180) {
      var x2 = (minAgo - 75) / 5;
      iobContrib = treatment.insulin * (0.001323 * x2 * x2 - .054233 * x2 + .55556);
      activityContrib = sens * treatment.insulin * (2 / dia / 60 - (minAgo - peak) * 2 / dia / 60 / (60 * dia - peak));
    } else {
      iobContrib = 0;
      activityContrib = 0;
    }

  }

  return {
    iobContrib: iobContrib,
    activityContrib: activityContrib
  };

}

function updateVisualisation() {
  var pill = this.currentDetails.find('span.pill.iob');

  if (!pill || pill.length == 0) {
    pill = $('<span class="pill iob"><label>IOB</label><em></em></span>');
    this.currentDetails.append(pill);
  }

  pill.find('em').text(this.iob.display + 'U');
}


function IOB() {
  return {
    label: 'Insulin-on-Board',
    calcTotal: calcTotal,
    getData: getData,
    updateVisualisation: updateVisualisation,
    isDataProvider: true,
    isVisualisationProvider: true
  };
}

module.exports = IOB;