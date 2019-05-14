$(document).ready(function() {
  const stationsOptions = getStationsOptions();

  // Set Jersey City as the center of the map
  loadMap([40.722601, -74.0197347], 11);


  // Add subway lines
  const subwayLinesLayer = L.geoJson(subwayLines,{
    style: lineStyle
  });
  subwayLinesLayer.addTo(map);

  // Add station ridership
  const allPointLayer = allPoints(stationRidership);
  allPointLayer.addTo(map);

  addStationLegend(map);

  // Add block groups
  const blockGroupLayer = L.geoJson(blockGroupData, {
    style: blockGroupStyle,
    onEachFeature: blockGroupPopup
  });
  const blockGroupDisplayCheck = $('#display_block_group');
  const blockGroupLegend = getBlockGroupLegend(map);
  blockGroupDisplayCheck.on('click', () => {
    if (blockGroupDisplayCheck.is(':checked')) {
      //Reorder layers by removing all layers first
      subwayLinesLayer.remove();
      allPointLayer.remove();
      // Add block group data
      blockGroupLayer.addTo(map);
      subwayLinesLayer.addTo(map);
      allPointLayer.addTo(map);
      blockGroupLegend.addTo(map);
    } else {
      blockGroupLayer.remove();
      map.removeControl(blockGroupLegend);
    }
  });

  // Station autocomplete dropdown setup
  $("#stationsDropdown").autocomplete({
    source: stationsOptions,
    focus: function(event, ui) {
      // prevent autocomplete from updating the textbox
      event.preventDefault();
      // manually update the textbox
      $(this).val(ui.item.label);
    },
    select: function(event, ui) {
      // prevent autocomplete from updating the textbox
      event.preventDefault();
      // manually update the textbox and hidden field
      $(this).val(ui.item.label);
      $("#stationSelected").val(ui.item.value);
    }
  });

  const markerSwitch = $('#marker_switch');
  markerSwitch.on('click', () => {
    const isChecked = markerSwitch.is(':checked');
    if (isChecked) {
      $('#buffer').prop('disabled', true);
    } else {
      $('#buffer').prop('disabled', false);
    }
  });

  map.on('draw:created', e => {
    const isChecked = markerSwitch.is(':checked');
    if (!isChecked) {
      const radius = $('#buffer').val() ? $('#buffer').val() : 1;
      drawBuffer(e, map, radius);
    } else {
      addRouteStop(e, map);
    }
  });

  $('#clear_markers').click(resetApplication);

  $( "#search" ).on('click', () => {
    $('#title_card').addClass('hidden');
    const stationSelected = $('#stationSelected').val();
    const stationSelectedName = $('#stationsDropdown').val();
    const radius = $('#buffer').val();

    // Get station coordinates from stationsOptions
    const coordinates = [stationsOptions[stationSelected - 1].coordinates[1], stationsOptions[stationSelected - 1].coordinates[0]];

    // Display station details
    const stationDetails =  '<div class="row">' +
                              '<div class="col-6">Name:</div><div class="col-6">' + stationSelectedName + '</div>' +
                            '</div>' +
                            '<div class="row">' +
                              '<div class="col-6">Line:</div><div class="col-6">' + stationsOptions[stationSelected - 1].line + '</div>' +
                            '</div>' +
                            '<div class="row">' +
                              '<div class="col-6">Average Weekday Ridership:</div><div class="col-6">' + stationsOptions[stationSelected - 1].ridership + '</div>' +
                            '</div>' +
                            '<div class="row">' +
                              '<div class="col-6">Change from 2016 to 2017:</div><div class="col-6">' + stationsOptions[stationSelected - 1].pctChange + '</div>' +
                            '</div>' +
                            '<div class="row">' +
                              '<div class="col-6">Rank:</div><div class="col-6">' + stationsOptions[stationSelected - 1].rank + '</div>' +
                            '</div>' +
                            '<div class="row justify-content-end">' +
                              '<div class="col-7">' +
                                '<button id="back" class="btn btn-primary"><i class="fas fa-eraser"></i>&nbsp;Clear</button>' +
                              '</div>'
                            '</div>';
    $('#search_details').html(stationDetails);

    // Clear map
    if (map) {
      map.eachLayer(layer => {
        layer.remove();
      });
      map.remove();
      map.removeControl(drawControl);
      map = null;
    }

    // Reload the map
    loadMap(coordinates, 15, buffer);

    L.geoJson(subwayLines,{
      style:lineStyle
    }).addTo(map);
    selectedPoints(stationRidership, stationSelectedName).addTo(map);

    addStationLegend(map);

    if (blockGroupDisplayCheck.is(':checked')) {
      // Add block group data
      blockGroupLayer.addTo(map);
      blockGroupLegend.addTo(map);
    } else {
      blockGroupLayer.remove();
      map.removeControl(blockGroupLegend);
    }

    // Go back to the main page
    $('#back').on('click', () => {
      location.reload();
    });

    //map.addControl(drawControl);
    map.on('draw:created', e => {
      const isChecked = $('#marker_switch').is(':checked');
      if (!isChecked) {
        var radius = $('#buffer').val() ? $('#buffer').val() : 1;
        drawBuffer(e, map, radius);
      } else {
        // Add the current station to state
        var marker = L.marker({
          lat: coordinates[0],
          lng: coordinates[1]
        });
        state.count = state.count + 1;
        state.markers.push(marker);
        map.addLayer(marker);

        addRouteStop(e, map);
      }
    });

    $('#clear_markers').click(resetApplication);

  });


});
