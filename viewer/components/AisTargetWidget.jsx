/**
 * Created by andreas on 23.02.16.
 */

var React=require("react");

var AisTargetWidget=React.createClass({
    propTypes:{
        //formatter: React.PropTypes.func,
        click: React.PropTypes.func,
        store: React.PropTypes.object.isRequired,
        propertyHandler: React.PropTypes.object.isRequired,
        classes: React.PropTypes.string
    },
    _getValues:function(){
        var aisTarget=this.props.store.getAisHandler().getNearestAisTarget();
        var color;
        if (aisTarget && aisTarget.mmsi){
            color=this.props.propertyHandler.getAisColor(aisTarget);
        }
        else{
            color=this.props.propertyHandler.getAisColor({});
        }
        var front=this.props.store.getValue('aisFront');
        if (front == "" || front == " ") front="X";
        return{
            dst:this.props.store.getValue('aisDst'),
            cpa:this.props.store.getValue('aisCpa'),
            tcpa:this.props.store.getValue('aisTcpa'),
            front:front,
            color: color,
            mmsi:aisTarget?aisTarget.mmsi:undefined
        };
    },
    getInitialState: function(){
        return this._getValues();
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState(this._getValues());
    },
    dataChanged: function(){
        var v=this._getValues();
        this.setState(v);
    },
    componentWillMount: function(){
        this.props.store.register(this);
    },
    componentWillUnmount: function(){
        this.props.store.deregister(this);
    },
    render: function(){
        var self=this;
        var classes="avn_widget avn_aisTargetWidget "+this.props.classes||"";
        var imgSrc=this.state.statusUrl;
        return (
            <div className={classes} style={{backgroundColor:this.state.color}} onClick={this.click}>
                <div className="avn_widgetInfoLeft">AIS</div>
                <div className="avn_widgetData avn_widgetDataFirst">
                    <span className='avn_label '>D</span>
                    <span className="avn_ais_data">{this.state.dst}</span>
                    <span className="avn_unit">nm</span>
                </div>
                <div className="avn_widgetData">
                    <span className='avn_label '>C</span>
                    <span className="avn_ais_data">{this.state.cpa}</span>
                    <span className="avn_unit">nm</span>
                </div>
                <div className="avn_widgetData">
                    <span className='avn_label '>T</span>
                    <span className="avn_ais_data">{this.state.tcpa}</span>
                    <span className="avn_unit">h</span>
                </div>
                <div className="avn_widgetData">
                    <span className='avn_ais_front avn_ais_data'>{this.state.front}</span>
                </div>
            </div>
        );
    },
    click:function(){
        this.props.click({mmsi:this.state.mmsi});
    }

});

module.exports=AisTargetWidget;