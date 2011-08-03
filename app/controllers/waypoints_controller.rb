class WaypointsController < ApplicationController
  # GET /waypoints
  # GET /waypoints.xml
  def search_foursquare
    res = foursquare.venues.search(:ll => params[:coords], :query => params[:query])
    render :text => res.to_json
  end
  def save_foursquare
    logger.info(params)
    #w = Waypoint.create!
    #fq = params[:fq]
    #fq["category_array"] = fq["categories"].map {|c, k| k["name"] }
    #w.import_from_fq(fq)

    render :text => params #w.as_json
  end

  def index
    @waypoints = Waypoint.all

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @waypoints }
    end
  end

  # GET /waypoints/1
  # GET /waypoints/1.xml
  def show
    @waypoint = Waypoint.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @waypoint }
    end
  end

  # GET /waypoints/1/edit
  def edit
    @waypoint = Waypoint.find(params[:id])
  end

  # PUT /waypoints/1
  # PUT /waypoints/1.xml
  def update
    @waypoint = Waypoint.find(params[:id])

    respond_to do |format|
      if @waypoint.update_attributes(params[:waypoint])
        format.html { redirect_to(@waypoint, :notice => 'Waypoint was successfully updated.') }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @waypoint.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /waypoints/1
  # DELETE /waypoints/1.xml
  def destroy
    @waypoint = Waypoint.find(params[:id])
    @waypoint.destroy

    respond_to do |format|
      format.html { redirect_to(waypoints_url) }
      format.xml  { head :ok }
    end
  end

end
